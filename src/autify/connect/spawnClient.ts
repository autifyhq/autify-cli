/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";
import {
  ChildProcess,
  execSync,
  spawn,
  StdioOptions,
} from "node:child_process";
import { parse } from "shell-quote";
import { constants } from "node:os";
import { get } from "../../config";
import { installClient } from "./installClient";

const parseClientArgs = (str: string): string[] =>
  parse(str).filter((a): a is string => typeof a === "string");

export type AutifyConnectClient = Readonly<{
  childProcess: ChildProcess;
  accessPoint: string;
  waitExit: () => Promise<number>;
}>;

type SpawnClientOptions = Readonly<{
  clientArgs?: string;
  stdio?: StdioOptions;
  exitOnSignal?: boolean;
  killBeforeWaitExit?: boolean;
}>;

const validateClient = (clientPath: string) => {
  try {
    execSync(`${clientPath} --version`, { stdio: "ignore" });
  } catch (error) {
    throw new CLIError(
      `Autify Connect Client failed to exec. (path: ${clientPath}, error: ${error})`
    );
  }
};

export const spawnClient = async (
  configDir: string,
  cacheDir: string,
  {
    clientArgs = "",
    stdio = "inherit",
    exitOnSignal = false,
    killBeforeWaitExit = false,
  }: SpawnClientOptions
): Promise<AutifyConnectClient> => {
  const clientPath = await installClient(cacheDir);
  validateClient(clientPath);
  const accessPoint = get(configDir, "AUTIFY_CONNECT_ACCESS_POINT_NAME");
  const key = get(configDir, "AUTIFY_CONNECT_ACCESS_POINT_KEY");
  if (!accessPoint || !key)
    throw new CLIError(
      "Autify Connect Access Point must be set. Use `autify connect access-point set` first."
    );
  const childProcess = spawn(clientPath, parseClientArgs(clientArgs), {
    env: {
      AUTIFY_CONNECT_KEY: key,
    },
    stdio,
  });
  const exitBySignalHandler = (signal: NodeJS.Signals) => {
    if (exitOnSignal)
      childProcess.on("exit", () =>
        // eslint-disable-next-line no-process-exit, unicorn/no-process-exit
        process.exit(128 + constants.signals[signal])
      );
    childProcess.kill(signal);
  };

  process.on("SIGINT", exitBySignalHandler);
  process.on("SIGTERM", exitBySignalHandler);
  return {
    childProcess,
    accessPoint,
    waitExit: () => {
      return new Promise((resolve, reject) => {
        childProcess.on("exit", (code) => resolve(code ?? 1));
        childProcess.on("error", (error) => reject(error));
        if (killBeforeWaitExit) childProcess.kill();
      });
    },
  };
};
