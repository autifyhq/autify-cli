/* eslint-disable unicorn/filename-case */
import { promisify } from "node:util";
import { exec } from "node:child_process";

export const execAutifyCli = async (
  args: string
): Promise<{ stdout: string; stderr: string }> => {
  const command = `autify-with-proxy ${args}`;
  const { stdout, stderr } = await promisify(exec)(command);
  return {
    stdout: stdout.replace(/\d{2}:\d{2}:\d{2}/g, "HH:MM:SS"),
    stderr: stderr,
  };
};
