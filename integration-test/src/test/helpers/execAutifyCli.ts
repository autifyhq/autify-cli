/* eslint-disable unicorn/filename-case */
import { promisify } from "node:util";
import { exec } from "node:child_process";
import stripAnsi from "strip-ansi";
import { env } from "node:process";

const normalize = (stdout: string) =>
  stdout
    .replace(/\[\d{2}:\d{2}:\d{2}]/g, "[HH:MM:SS]")
    .replace(/path: .+autifyconnect[^,]*,/g, "path: /path/to/autifyconnect,")
    .replace(
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
      "YYYY-MM-DDTHH:MM:SS.MMMZ"
    )
    .replace(/debugServerPort: \d+,/g, "debugServerPort: <random>,")
    .replace(
      /debug server on http:\/\/localhost:\d+/g,
      "debug server on http://127.0.0.1:<random>"
    )
    .replace(
      /debug server on http:\/\/127.0.0.1:\d+/g,
      "debug server on http://127.0.0.1:<random>"
    )
    .replace(/Your session ID is "[^"]+"/, 'Your session ID is "fake"')
    .replace(/»/g, "›");

export const execAutifyCli = async (
  args: string
): Promise<{ stdout: string; stderr: string }> => {
  const command = `autify-with-proxy ${process.platform === "win32" ? args.replaceAll(/"([^"]+)"/g, '""""$1""') : args}`;
  const { stdout, stderr } = await promisify(exec)(command, { env });
  return {
    stdout: normalize(stripAnsi(stdout)),
    stderr: normalize(stripAnsi(stderr)),
  };
};
