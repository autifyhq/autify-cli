/* eslint-disable unicorn/filename-case */
import { promisify } from "node:util";
import { exec } from "node:child_process";
import stripAnsi from "strip-ansi";
import { env } from "node:process";

const normalize = (stdout: string) =>
  stdout
    .replace(/\[\d{2}:\d{2}:\d{2}]/g, "[HH:MM:SS]")
    .replace(
      /path: .+autifyconnect-fake(\.exe)?,/g,
      "path: /path/to/autifyconnect-fake,"
    )
    .replace(
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g,
      "YYYY-MM-DDTHH:MM:SS.MMMZ"
    )
    .replace(/Your session ID is "[^"]+"/, 'Your session ID is "fake"');

export const execAutifyCli = async (
  args: string
): Promise<{ stdout: string; stderr: string }> => {
  const command = `autify-with-proxy ${args}`;
  const { stdout, stderr } = await promisify(exec)(command, { env });
  return {
    stdout: normalize(stripAnsi(stdout)),
    stderr: stripAnsi(stderr),
  };
};
