/* eslint-disable unicorn/filename-case */
import { WebClient } from "@autifyhq/autify-sdk";
import { CLIError } from "@oclif/errors";
import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { env } from "node:process";
import { EventEmitter } from "node:stream";
import { Logger } from "winston";
import { get } from "../../../config";
import {
  AccessPoint,
  createEphemeralAccessPointForWeb,
  createStaticAccessPoint,
} from "./AccessPoint";
import {
  AUTIFY_CONNECT_CLIENT_SUPPORTED_VERSION,
  ConnectClientVersionMismatchError,
  getInstallPath,
  getInstallVersion,
  validateVersion,
} from "../installClient";
import { waitFor } from "xstate/lib/waitFor";
import { DebugServerClient } from "./DebugServerClient";
import { ClientStateMachineService, createService } from "./StateMachine";
import {
  createClientLogger,
  createManagerLogger,
  setupClientOutputLogger,
} from "./Logger";
import { join } from "node:path";
import TypedEmitter from "typed-emitter";
import getPort from "get-port";
import { getWebClient } from "../../web/getWebClient";

export type ClientEvents = TypedEmitter<{
  log: (msg: string) => void;
  starting: (msg: string) => void;
  ready: (msg: string) => void;
  reconnecting: (msg: string) => void;
  error: (error: Error) => void;
}>;

export type ProcessExit = Readonly<{
  code: number | null;
  signal: NodeJS.Signals | null;
}>;
export class StateMachineTimeoutError extends CLIError {
  constructor(state: string) {
    super(`Autify Connect Manager faced timeout at ${state} state.`);
  }
}

type ClientManagerOptions = Readonly<{
  configDir: string;
  cacheDir: string;
  verbose?: boolean;
  fileLogging?: boolean;
  debugServerPort?: number;
}>;

export class ClientManager {
  public static async create(
    options: ClientManagerOptions & {
      userAgent: string;
      webWorkspaceId?: number;
    }
  ): Promise<ClientManager> {
    if (options.webWorkspaceId) {
      const { configDir, userAgent, webWorkspaceId } = options;
      const client = getWebClient(configDir, userAgent);
      return this.createWithEphemeralAccessPointForWeb(
        client,
        webWorkspaceId,
        options
      );
    }

    return this.createWithStaticAccessPoint(options);
  }

  private static async createWithStaticAccessPoint(
    options: ClientManagerOptions
  ): Promise<ClientManager> {
    const name = get(options.configDir, "AUTIFY_CONNECT_ACCESS_POINT_NAME");
    const key = get(options.configDir, "AUTIFY_CONNECT_ACCESS_POINT_KEY");
    if (!name || !key)
      throw new CLIError(
        "Access Point is not saved. Run `autify connect access-point create/set` first."
      );
    const accessPoint = createStaticAccessPoint(name, key);
    return new ClientManager(accessPoint, options);
  }

  private static async createWithEphemeralAccessPointForWeb(
    client: WebClient,
    workspaceId: number,
    options: ClientManagerOptions
  ): Promise<ClientManager> {
    const accessPoint = await createEphemeralAccessPointForWeb(
      client,
      workspaceId
    );
    return new ClientManager(accessPoint, options);
  }

  public async start(): Promise<void> {
    try {
      this.logger.debug("start");
      const version = await this.getClientVersion();
      const debugServerPort = this.options.debugServerPort ?? (await getPort());
      this.logger.info(
        `Starting Autify Connect Client (accessPoint: ${this.accessPointName}, debugServerPort: ${debugServerPort}, path: ${this.clientPath}, version: ${version})`
      );
      this.service.send("SPAWN", { debugServerPort });
    } catch (error) {
      this.service.send("FAIL", { error });
      throw error;
    }
  }

  public async onceReady(): Promise<void> {
    this.logger.debug("onceReady");
    await this.once("ready");
  }

  public async onceTerminating(): Promise<void> {
    this.logger.debug("onceTerminating");
    await this.once("terminating");
  }

  public async onceDone(): Promise<number | null> {
    this.logger.debug("onceDone");
    const {
      context: { processExit },
    } = await this.once("done");
    if (!processExit) {
      this.logger.warn(
        "Autify Connect Client exited but unable to capture the exit status"
      );
      return null;
    }

    this.logger.info(
      `Autify Connect Client exited (code: ${processExit.code}, signal: ${processExit.signal})`
    );
    return processExit.code;
  }

  public async exit(options?: {
    ignoreError: boolean;
  }): Promise<number | null> {
    try {
      this.logger.debug("exit");
      const snapshot = this.service.getSnapshot();
      if (snapshot.done) {
        this.logger.debug("Already exited.");
        return snapshot.context.processExit?.code || null;
      }

      this.service.send("TERMINATE");
      return await this.onceDone();
    } catch (error) {
      if (options?.ignoreError) {
        this.logger.warn(`Ignoring exit error: ${error}`);
        return null;
      }

      throw error;
    }
  }

  public get accessPointName(): string {
    return this.accessPoint.name;
  }

  private readonly clientEvents = new EventEmitter() as ClientEvents;
  private readonly logger: Logger;
  private readonly clientLogger: Logger;
  private readonly service: ClientStateMachineService;
  private childProcess?: ChildProcessWithoutNullStreams;
  private debugServerClient?: DebugServerClient;

  private constructor(
    private readonly accessPoint: AccessPoint,
    private readonly options: ClientManagerOptions
  ) {
    const level = options.verbose ? "debug" : "info";
    this.logger = createManagerLogger({ level });
    if (accessPoint.type === "ephemeral")
      this.logger.info(
        `Ephemeral Access Point was created: ${this.accessPointName}`
      );
    const filename = options.fileLogging
      ? join(options.cacheDir, `autifyconnect-${Date.now()}-${process.pid}.log`)
      : undefined;
    if (filename) this.logger.info(`Client log will be written on ${filename}`);
    this.clientLogger = createClientLogger({ level }, filename);
    this.service = createService({
      spawn: (debugServerPort) => this.spawn(debugServerPort),
      terminate: () => this.terminate(),
      kill: () => this.kill(),
      cleanup: () => this.cleanup(),
      errors: [],
    }).onTransition((state, event) => {
      if (!state.changed) return;
      this.logger.debug(
        `Transition to: ${state.value}, event: ${JSON.stringify(event)}`
      );
    });
    process.on("SIGINT", () => this.service.send("TERMINATE"));
    process.on("SIGTERM", () => this.service.send("TERMINATE"));
    this.clientEvents.on("ready", () => {
      this.service.send("READY");
    });
    this.clientEvents.on("log", (msg) => {
      // Guardrail in case debug server isn't working well.
      if (msg.includes("Successfully connected")) {
        this.clientEvents.emit("ready", msg);
      }
    });
    this.clientEvents.on("error", (error) => {
      this.logger.warn(`Ignoring client error: ${error}`);
    });
  }

  private spawn(debugServerPort: number) {
    try {
      const args = [
        "--log-format",
        "json",
        "--experimental-debug-server-port",
        debugServerPort.toString(),
      ];
      if (this.options.verbose) args.push("--verbose");
      this.childProcess = spawn(this.clientPath, args, {
        env: {
          ...env,
          AUTIFY_CONNECT_KEY: this.accessPoint.key,
        },
      });
      this.childProcess.on("exit", (code, signal) => {
        this.service.send("EXIT", { processExit: { code, signal } });
      });
      this.debugServerClient = new DebugServerClient(
        debugServerPort,
        this.clientEvents
      );
      setupClientOutputLogger(this.childProcess, (log) => {
        this.clientLogger.log(log.level, log.msg);
        this.clientEvents.emit("log", log.msg);
      });
    } catch (error) {
      this.logger.warn(`Ignoring spawn error: ${error}`);
    }
  }

  private async terminate() {
    try {
      this.logger.debug("terminate");
      await this.debugServerClient?.requestTerminate();
    } catch (error) {
      this.logger.warn(`Ignoring terminate error: ${error}`);
    }
  }

  private kill() {
    try {
      this.logger.debug("kill");
      this.childProcess?.kill();
    } catch (error) {
      this.logger.warn(`Ignoring kill error: ${error}`);
    }
  }

  private async cleanup() {
    try {
      this.logger.debug("cleanup start");
      this.debugServerClient?.stopStatusTimer();
      if (this.accessPoint.type === "ephemeral") {
        await this.accessPoint.delete();
        this.logger.info(
          `Ephemeral Access Point was deleted: ${this.accessPointName}`
        );
      }

      this.logger.debug("cleanup done");
    } catch (error) {
      this.logger.warn(`Ignoring cleanup error: ${error}`);
    }
  }

  private async once(waitState: string) {
    let state;
    try {
      state = await waitFor(
        this.service,
        (state) =>
          state.matches(waitState) ||
          state.matches("done") ||
          state.matches("failed"),
        {
          timeout: Number.POSITIVE_INFINITY,
        }
      );
    } catch {
      throw new CLIError(
        `Unknown state transition: ${this.service.getSnapshot().value}`
      );
    }

    if (state.value === "failed")
      this.logger.warn(`Failed (${state.context.errors})`);
    const timeoutError = state.context.errors.find(
      (error) => error instanceof StateMachineTimeoutError
    );
    if (timeoutError) throw timeoutError;

    return state;
  }

  private get clientPath() {
    return getInstallPath(this.options.configDir, this.options.cacheDir);
  }

  private async getClientVersion() {
    const clientVersion = await getInstallVersion(this.clientPath);
    try {
      await validateVersion(
        clientVersion,
        AUTIFY_CONNECT_CLIENT_SUPPORTED_VERSION
      );
    } catch (error) {
      if (error instanceof ConnectClientVersionMismatchError) {
        this.logger.warn(
          "Installed Autify Connect Client version doesn't match our supported version. " +
            "Consider to run `autify connect client install` to install the supported version. " +
            `(version: ${clientVersion}, supported: ${AUTIFY_CONNECT_CLIENT_SUPPORTED_VERSION})`
        );
      }
    }

    return clientVersion;
  }
}
