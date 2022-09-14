/* eslint-disable unicorn/filename-case */
import { ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import {
  createLogger,
  format,
  Logger,
  LoggerOptions,
  transports,
} from "winston";

type ClientLog = Readonly<{
  level: string;
  ts: string;
  msg: string;
}>;

const logFormatConsole = (prefix: string) =>
  format.combine(
    format.colorize(),
    format.printf(
      ({ level, message }) => `${prefix.padEnd(25)} ${level}\t${message}`
    )
  );

const logFormatFile = () =>
  format.combine(
    format.timestamp(),
    format.printf(
      ({ timestamp, level, message }) => `${timestamp}\t${level}\t${message}`
    )
  );

export const createManagerLogger = (options: LoggerOptions): Logger => {
  return createLogger(options).add(
    new transports.Console({
      format: logFormatConsole("[Autify Connect Manager]"),
    })
  );
};

export const createClientLogger = (
  options: LoggerOptions,
  filename?: string
): Logger => {
  const logger = createLogger(options);
  filename
    ? logger.add(
        new transports.File({
          format: logFormatFile(),
          filename,
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
    input: childProcess.stdout,
    crlfDelay: Number.POSITIVE_INFINITY,
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
