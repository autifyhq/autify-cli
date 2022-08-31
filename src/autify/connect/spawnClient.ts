/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";
import { spawn } from "node:child_process";
import { get } from "../../config";
import { getInstallPath, getInstallVersion } from "./installClient";
import { createInterface } from "node:readline";
import { once, EventEmitter } from "node:events";
import { createLogger, format, transports } from "winston";
import { join } from "node:path";

const getOrCreateAccessPoint = (configDir: string) => {
  const accessPoint = get(configDir, "AUTIFY_CONNECT_ACCESS_POINT_NAME");
  const key = get(configDir, "AUTIFY_CONNECT_ACCESS_POINT_KEY");
  const isEphemeral = false;
  if (!accessPoint || !key)
    throw new CLIError(
      "Autify Connect Access Point must be set. Use `autify connect access-point set` first."
    );

  return {
    accessPoint,
    key,
    isEphemeral,
  };
};

const logger = createLogger({
  level: "debug",
});

const setupLogger = (logFile?: string) => {
  if (logFile) {
    logger.add(
      new transports.File({
        filename: logFile,
        format: format.combine(
          format.colorize(),
          format.timestamp(),
          format.align(),
          format.printf(
            ({ timestamp, level, message }) =>
              `${timestamp} ${level} ${message}`
          )
        ),
      })
    );
  } else {
    logger.add(
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.timestamp(),
          format.align(),
          format.printf(
            ({ timestamp, level, message }) =>
              `[Autify Connect Client] ${timestamp} ${level} ${message}`
          )
        ),
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

export class ClientExitError extends CLIError {
  constructor(
    readonly exitCode: number | null,
    readonly exitSignal: NodeJS.Signals | null,
    logFile?: string
  ) {
    let message = `Autify Connect Client exited (code: ${exitCode}, signal: ${exitSignal}).`;
    if (logFile) message += ` See logs at ${logFile}`;
    super(message);
  }
}

export type AutifyConnectClient = Readonly<{
  version: string;
  logFile?: string;
  accessPoint: string;
  kill: () => void;
  waitReady: () => Promise<any[]>;
  waitExit: () => Promise<any[]>;
}>;

type SpawnClientOptions = Readonly<{
  verbose?: boolean;
  fileLogging?: boolean;
}>;

export const spawnClient = async (
  configDir: string,
  cacheDir: string,
  { verbose = false, fileLogging = true }: SpawnClientOptions
): Promise<AutifyConnectClient> => {
  const state = new EventEmitter();
  const clientPath = getInstallPath(cacheDir);
  const args = ["--log-format", "json"];
  if (verbose) args.push("--verbose");
  const version = await getInstallVersion(clientPath);
  const { accessPoint, key } = getOrCreateAccessPoint(configDir);
  const childProcess = spawn(clientPath, args, {
    env: {
      AUTIFY_CONNECT_KEY: key,
    },
  });
  const logFile = fileLogging
    ? join(cacheDir, `autifyconnect-${Date.now()}-${childProcess.pid}.log`)
    : undefined;
  setupLogger(logFile);
  process.on("SIGINT", childProcess.kill);
  process.on("SIGTERM", childProcess.kill);
  childProcess.on("exit", (code, signal) => {
    state.emit("error", new ClientExitError(code, signal, logFile));
  });
  childProcess.stderr.pipe(process.stderr);
  onLogMsg(childProcess.stdout, (msg) => {
    if (msg.includes("Successfully connected")) {
      state.emit("ready");
    }
  });

  return {
    version,
    logFile,
    accessPoint,
    kill: () => childProcess.kill(),
    waitReady: async () => once(state, "ready"),
    // Wait a fake event to catch ClientExitError.
    waitExit: async () => once(state, "_"),
  };
};
