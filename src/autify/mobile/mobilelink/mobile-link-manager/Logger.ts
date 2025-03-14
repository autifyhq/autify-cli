/* eslint-disable unicorn/filename-case */
/* eslint-disable @typescript-eslint/no-unused-expressions */
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
  timestamp: string;
  message: string;
}>;

const logFormatConsole = (prefix: string) =>
  format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(
      ({ timestamp, level, message }) =>
        `${prefix.padEnd(25)} ${timestamp}\t${level}\t${message}`
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
      format: logFormatConsole("[Mobile Link Manager]"),
    })
  );
};

export const createMobileLinkLogger = (
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
          format: logFormatConsole("[Mobile Link] "),
        })
      );
  return logger;
};

export const setupMobileLinkOutputLogger = (
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
      callback({
        level: "info",
        timestamp: new Date().toISOString(),
        message: line,
      });
    }
  });
  // stderr
  childProcess.stderr.pipe(process.stderr);
};
