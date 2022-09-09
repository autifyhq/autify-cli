import { execFile, spawn } from "node:child_process";
import { platform } from "node:process";
import { promisify } from "node:util";

type SpawnFunc = (
  command: string,
  args: readonly string[],
  ...rest: any[]
) => any;

const cross =
  <F extends SpawnFunc>(func: F) =>
  (...params: Parameters<F>) => {
    const [command, args, ...rest] = params;
    if (platform !== "win32" || command.endsWith(".exe"))
      return func(command, args, ...rest);
    return func("cmd", ["/s", "/c", command, ...args], ...rest);
  };

export const crossSpawn = cross(spawn);
export const crossExecFilePromise = cross(promisify(execFile));
