/* eslint-disable unicorn/filename-case */
import { ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import {
  Logger,
  LoggerOptions,
  createLogger,
  format,
  transports,
} from "winston";

type ClientLog = Readonly<{
  level: string;
  msg: string;
  ts: string;
}>;

const logFormatConsole = (prefix: string) =>
  format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(
      ({ level, message, timestamp }) =>
        `${prefix.padEnd(25)} ${timestamp}\t${level}\t${message}`
    )
  );

const logFormatFile = () =>
  format.combine(
    format.timestamp(),
    format.printf(
      ({ level, message, timestamp }) => `${timestamp}\t${level}\t${message}`
    )
  );

export const createManagerLogger = (options: LoggerOptions): Logger =>
  createLogger(options).add(
    new transports.Console({
      format: logFormatConsole("[Autify Connect Manager]"),
    })
  );

export const createClientLogger = (
  options: LoggerOptions,
  filename?: string
): Logger => {
  const logger = createLogger(options);
  filename
    ? logger.add(
        new transports.File({
          filename,
          format: logFormatFile(),
        })
      )
    : logger.add(
        new transports.Console({
          format: logFormatConsole("[Autify Connect Client] "),
        })
      );
  return logger;
};

export const setupClientOutputLogger = (
  childProcess: ChildProcessWithoutNullStreams,
  callback: (log: ClientLog) => void
): void => {
  // stdout
  createInterface({
    crlfDelay: Number.POSITIVE_INFINITY,
    input: childProcess.stdout,
  }).on("line", (line) => {
    try {
      callback(JSON.parse(line) as ClientLog);
    } catch {
      // Ignore errors
    }
  });
  // stderr
  childProcess.stderr.pipe(process.stderr);
};
