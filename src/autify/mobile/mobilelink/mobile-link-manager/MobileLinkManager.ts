/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";
import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { env } from "node:process";
import { EventEmitter } from "node:stream";
import { Logger } from "winston";
import { getBinaryPath, getInstallVersion } from "../installBinary";
import { getInstallPath } from "../../../connect/installClient";
import { waitFor } from "xstate/lib/waitFor";
import { MobileLinkStateMachineService, createService } from "./StateMachine";
import {
  createMobileLinkLogger,
  createManagerLogger,
  setupMobileLinkOutputLogger,
} from "./Logger";
import TypedEmitter from "typed-emitter";

export type MobileLinkEvents = TypedEmitter<{
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
    super(`MobileLink Manager faced timeout at ${state} state.`);
  }
}

type MobileLinkManagerOptions = Readonly<{
  configDir: string;
  cacheDir: string;
}>;

export class MobileLinkManager {
  public async exec(argv: string[]): Promise<void> {
    this.logger.debug("exec");
    const version = await this.getMobiieLinkVersion();
    this.logger.info(
      `Executing MobileLink (path: ${this.mobileLinkPath}, args: ${argv.join(" ")}, version: ${version})`
    );
    this.spawn(argv);
  }

  public async start(workspaceId?: string): Promise<void> {
    try {
      this.logger.debug("start");
      const version = await this.getMobiieLinkVersion();
      this.logger.info(
        `Executing MobileLink (path: ${this.mobileLinkPath}, args: link start, version: ${version})`
      );
      this.service.send("START", { workspaceId });
    } catch (error) {
      this.service.send("FAIL", { error });
      throw error;
    }
  }

  public async setup(): Promise<void> {
    this.exec(["link", "setup"]);
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
        "MobileLink exited but unable to capture the exit status"
      );
      return null;
    }

    this.logger.info(
      `MobileLinkt exited (code: ${processExit.code}, signal: ${processExit.signal})`
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

  private readonly clientEvents = new EventEmitter() as MobileLinkEvents;
  private readonly logger: Logger;
  private readonly clientLogger: Logger;
  private readonly service: MobileLinkStateMachineService;
  private childProcess?: ChildProcessWithoutNullStreams;

  public constructor(private readonly options: MobileLinkManagerOptions) {
    const level = "info";
    this.logger = createManagerLogger({ level });
    this.clientLogger = createMobileLinkLogger({ level });
    this.service = createService({
      start: (workspaceId) => this.linkStart(workspaceId),
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
      if (
        msg.includes("Local devices are ready for use") ||
        msg.includes(
          "起動しました。ローカルデバイスを利用する準備ができました。"
        )
      ) {
        this.clientEvents.emit("ready", msg);
      }
    });
    this.clientEvents.on("error", (error) => {
      this.logger.warn(`Ignoring client error: ${error}`);
    });
  }

  private spawn(
    argv: string[],
    extraEnv: { [key: string]: string } = {},
    connectConsole: boolean = true
  ) {
    this.childProcess = spawn(this.mobileLinkPath, argv, {
      env: {
        ...env,
        ...extraEnv,
      },
    });
    if (connectConsole) {
      this.childProcess.stdout.pipe(process.stdout);
      this.childProcess.stderr.pipe(process.stderr);
      process.stdin.pipe(this.childProcess.stdin);
    }
  }

  private linkStart(workspaceId?: string) {
    try {
      const argv = ["link", "start"];
      if (workspaceId) argv.push(workspaceId);
      this.spawn(
        argv,
        {
          AUTIFY_CONNECT_BIN_PATH: this.autifyConnectPath,
        },
        false
      );
      if (this.childProcess) {
        this.childProcess.on("exit", (code, signal) => {
          this.service.send("EXIT", { processExit: { code, signal } });
        });
        setupMobileLinkOutputLogger(this.childProcess, (log) => {
          this.clientLogger.log(log.level, log.message);
          this.clientEvents.emit("log", log.message);
        });
      }
    } catch (error) {
      this.logger.warn(`Ignoring start error: ${error}`);
    }
  }

  private async terminate() {
    try {
      this.logger.debug("terminate");
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

  private get mobileLinkPath() {
    return getBinaryPath(this.options.cacheDir);
  }

  private async getMobiieLinkVersion() {
    return getInstallVersion(this.mobileLinkPath);
  }

  private get autifyConnectPath() {
    return getInstallPath(this.options.configDir, this.options.cacheDir);
  }
}
