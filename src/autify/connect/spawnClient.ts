/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";
import { getInstallPath, getInstallVersion } from "./installClient";
import { createInterface } from "node:readline";
import { once, EventEmitter } from "node:events";
import { createLogger, format, transports } from "winston";
import { join } from "node:path";
import { WebClient } from "@autifyhq/autify-sdk";
import { get } from "../../config";
import { v4 as uuid } from "uuid";
import { env, platform } from "node:process";
import { ctrlc } from "ctrlc-windows";
import { spawn } from "node:child_process";

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

type ProcessExit = [code: number | null, signal: NodeJS.Signals | null];

export type AutifyConnectClient = Readonly<{
  version: string;
  logFile?: string;
  accessPointName: string;
  kill: () => void;
  waitReady: () => Promise<any[]>;
  waitExit: () => Promise<
    [...ProcessExit, ...[deletedAccessPointName?: string]]
  >;
}>;

type SpawnClientOptions = Readonly<{
  verbose?: boolean;
  fileLogging?: boolean;
  ephemeralAccessPoint?: EphemeralAccessPoint;
}>;

export const spawnClient = async (
  configDir: string,
  cacheDir: string,
  { verbose, fileLogging, ephemeralAccessPoint }: SpawnClientOptions
): Promise<AutifyConnectClient> => {
  const state = new EventEmitter();
  const clientPath = getInstallPath(configDir, cacheDir);
  const args = ["--log-format", "json"];
  if (verbose) args.push("--verbose");
  const version = await getInstallVersion(clientPath);
  const { accessPointName, accessPointKey } = await getOrCreateAccessPoint(
    configDir,
    ephemeralAccessPoint
  );
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

  return {
    version,
    logFile,
    accessPointName,
    kill: () => {
      if (platform === "win32" && !env.JEST_WORKER_ID) ctrlc(childProcess.pid!);
      else childProcess.kill("SIGINT");
    },
    waitReady: async () => clientReady,
    waitExit: async () => {
      const [code, signal] = await childProcessExit;
      const deletedAccessPointName = await deleteAccessPointIfPossible(
        accessPointName,
        ephemeralAccessPoint
      );
      return [code, signal, deletedAccessPointName];
    },
  };
};
