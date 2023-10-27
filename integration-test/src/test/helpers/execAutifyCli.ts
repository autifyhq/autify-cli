/* eslint-disable unicorn/filename-case */
import { exec } from "node:child_process";
import { env } from "node:process";
import { promisify } from "node:util";
import stripAnsi from "strip-ansi";

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
): Promise<{ stderr: string; stdout: string }> => {
  const command = `autify-with-proxy ${args}`;
  const { stderr, stdout } = await promisify(exec)(command, { env });
  return {
    stderr: normalize(stripAnsi(stderr)),
    stdout: normalize(stripAnsi(stdout)),
  };
};
