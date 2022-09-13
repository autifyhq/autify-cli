/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";
import {
  AUTIFY_CONNECT_CLIENT_SUPPORTED_VERSION,
  ConnectClientVersionMismatchError,
  getInstallPath,
  getInstallVersion,
  validateVersion,
} from "./installClient";
import { createInterface } from "node:readline";
import { once, EventEmitter } from "node:events";
import { createLogger, format, transports } from "winston";
import { join } from "node:path";
import { WebClient } from "@autifyhq/autify-sdk";
import { get } from "../../config";
import { v4 as uuid } from "uuid";
import { env } from "node:process";
import { spawn } from "node:child_process";
import fetch from "node-fetch";
import { setInterval as setIntervalPromise } from "node:timers/promises";
import isRunning from "is-running";

type EphemeralAccessPoint = Readonly<{
  webClient: WebClient;
  workspaceId: number;
}>;

const EPHEMERAL_ACCESS_POINT_NAME_PREFIX = "autify-cli-";

const logger = createLogger({
  level: "debug",
});

const getOrCreateAccessPoint = async (
  configDir: string,
  ephemeralAccessPoint?: EphemeralAccessPoint
) => {
  if (!ephemeralAccessPoint) {
    const accessPointName = get(configDir, "AUTIFY_CONNECT_ACCESS_POINT_NAME");
    const accessPointKey = get(configDir, "AUTIFY_CONNECT_ACCESS_POINT_KEY");
    if (!accessPointName || !accessPointKey)
      throw new CLIError(
        "Access Point is not set. Run `autify connect access-point set` first."
      );
    return { accessPointName, accessPointKey };
  }

  const { webClient, workspaceId } = ephemeralAccessPoint;
  const name = `${EPHEMERAL_ACCESS_POINT_NAME_PREFIX}${uuid()}`;
  const { name: accessPointName, key: accessPointKey } = (
    await webClient.createAccessPoint(workspaceId, { name })
  ).data;
  return { accessPointName, accessPointKey };
};

const deleteAccessPointIfPossible = async (
  accessPointName: string,
  ephemeralAccessPoint?: EphemeralAccessPoint
) => {
  if (!ephemeralAccessPoint) return;
  if (!accessPointName.startsWith(EPHEMERAL_ACCESS_POINT_NAME_PREFIX)) return;

  const { webClient, workspaceId } = ephemeralAccessPoint;
  try {
    await webClient.deleteAccessPoint(workspaceId, { name: accessPointName });
    return accessPointName;
  } catch {
    // Ignore errors since this is best effort.
  }
};

const logFormat = (prefix?: string) =>
  format.combine(
    format.colorize(),
    format.timestamp(),
    format.align(),
    format.printf(
      ({ timestamp, level, message }) =>
        `${prefix ?? ""}${timestamp} ${level} ${message}`
    )
  );

const setupLogger = (logFile?: string) => {
  if (logFile) {
    logger.add(
      new transports.File({
        filename: logFile,
        format: logFormat(),
      })
    );
  } else {
    logger.add(
      new transports.Console({
        format: logFormat("[Autify Connect Client] "),
      })
    );
  }
};

type Log = Readonly<{
  level: string;
  ts: string;
  msg: string;
}>;

const onLogMsg = (
  input: NodeJS.ReadableStream,
  handler: (msg: string) => void
) => {
  return createInterface({
    input,
    crlfDelay: Number.POSITIVE_INFINITY,
  }).on("line", (line) => {
    let msg = line;
    try {
      const log = JSON.parse(line) as Log;
      msg = log.msg;
      logger.log(log.level, log.msg);
    } finally {
      handler(msg);
    }
  });
};

export const DEFAULT_CLIENT_DEBUG_SERVER_PORT = 3000;

const requestDebugServer = async (
  port: number,
  path: string,
  method = "GET"
) => {
  const response = await fetch(`http://localhost:${port}${path}`, { method });
  if (response.ok) return response.json();
  throw new CLIError(
    `Request to debug server failed: ${method} ${path} => ${response.status} ${response.statusText}`
  );
};

type DebugServerStatusResponse = Readonly<{
  status: string;
  message: string;
}>;

const requestDebugServerStatus = async (port: number) => {
  const response = (await requestDebugServer(
    port,
    "/status"
  )) as DebugServerStatusResponse;
  if (!response.status || !response.message)
    return new CLIError(
      `Invalid response from GET /status: ${JSON.stringify(response)}`
    );
  return response;
};

type ProcessExit = [code: number | null, signal: NodeJS.Signals | null];

export type AutifyConnectClient = Readonly<{
  version: string;
  versionMismatchWarning?: string;
  logFile?: string;
  accessPointName: string;
  kill: () => Promise<void>;
  waitReady: () => Promise<void>;
  waitExit: () => Promise<
    [...ProcessExit, ...[deletedAccessPointName?: string]]
  >;
}>;

type SpawnClientOptions = Readonly<{
  verbose?: boolean;
  fileLogging?: boolean;
  debugServerPort?: number;
  ephemeralAccessPoint?: EphemeralAccessPoint;
}>;

export const spawnClient = async (
  configDir: string,
  cacheDir: string,
  errorHandler: (error: Error) => void,
  {
    verbose,
    fileLogging,
    debugServerPort = DEFAULT_CLIENT_DEBUG_SERVER_PORT,
    ephemeralAccessPoint,
  }: SpawnClientOptions
): Promise<AutifyConnectClient> => {
  const state = new EventEmitter();
  state.on("error", errorHandler);
  const clientPath = getInstallPath(configDir, cacheDir);
  const version = await getInstallVersion(clientPath);
  let versionMismatchWarning;
  try {
    await validateVersion(version, AUTIFY_CONNECT_CLIENT_SUPPORTED_VERSION);
  } catch (error) {
    if (error instanceof ConnectClientVersionMismatchError) {
      versionMismatchWarning =
        "Installed Autify Connect Client version doesn't match our supported version. " +
        "Consider to run `autify connect client install` to install the supported version. " +
        `(version: ${version}, supported: ${AUTIFY_CONNECT_CLIENT_SUPPORTED_VERSION})`;
    }
  }

  const { accessPointName, accessPointKey } = await getOrCreateAccessPoint(
    configDir,
    ephemeralAccessPoint
  );
  const args = [
    "--log-format",
    "json",
    "--experimental-debug-server-port",
    debugServerPort.toString(),
  ];
  if (verbose) args.push("--verbose");
  const childProcess = spawn(clientPath, args, {
    env: {
      ...env,
      AUTIFY_CONNECT_KEY: accessPointKey,
    },
  });
  const logFile = fileLogging
    ? join(cacheDir, `autifyconnect-${Date.now()}-${childProcess.pid}.log`)
    : undefined;
  setupLogger(logFile);
  process.on("SIGINT", childProcess.kill);
  process.on("SIGTERM", childProcess.kill);
  const clientReady = once(state, "ready");
  const childProcessExit = once(childProcess, "exit") as Promise<ProcessExit>;

  childProcess.stderr.pipe(process.stderr);
  onLogMsg(childProcess.stdout, (msg) => {
    if (msg.includes("Successfully connected")) {
      state.emit("ready");
    }
  });
  const statusTimer = setInterval(async () => {
    try {
      const response = await requestDebugServerStatus(debugServerPort);
      if (response instanceof CLIError) state.emit("error", response);
      else state.emit(response.status, response.message);
    } catch (error) {
      state.emit("error", error);
    }
  }, 1000);

  const kill = async () => {
    try {
      await requestDebugServer(debugServerPort, "/terminate", "POST");
      for await (const start of setIntervalPromise(1000, Date.now())) {
        if (childProcess.pid && !isRunning(childProcess.pid)) break;
        if (Date.now() - start > 5000) break;
      }
    } catch {
      // Ignore any exceptions to fallback to signal.
    } finally {
      // Guardrail.
      childProcess.kill("SIGINT");
    }
  };

  return {
    version,
    versionMismatchWarning,
    logFile,
    accessPointName,
    kill,
    waitReady: async () => {
      try {
        await clientReady;
      } catch (error) {
        await kill();
        throw error;
      }
    },
    waitExit: async () => {
      const [code, signal] = await childProcessExit;
      clearInterval(statusTimer);
      const deletedAccessPointName = await deleteAccessPointIfPossible(
        accessPointName,
        ephemeralAccessPoint
      );
      return [code, signal, deletedAccessPointName];
    },
  };
};
