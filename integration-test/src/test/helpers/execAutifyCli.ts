/* eslint-disable unicorn/filename-case */
import { promisify } from "node:util";
import { exec, ExecException } from "node:child_process";
import stripAnsi from "strip-ansi";

// https://nodejs.org/api/child_process.html
// > In case of an error (including any error resulting in an exit code other than 0), a rejected promise is returned, with the same error object given in the callback, but with two additional properties stdout and stderr.
type PromisifiedExecException = ExecException & {
  stdout: string;
  stderr: string;
};

export const execAutifyCli = async (
  args: string
): Promise<{ stdout: string; stderr: string; code: number }> => {
  const command = `autify-with-proxy ${args}`;
  try {
    const { stdout, stderr } = await promisify(exec)(command);
    return {
      stdout: stripAnsi(stdout).replace(/\d{2}:\d{2}:\d{2}/g, "HH:MM:SS"),
      stderr: stripAnsi(stderr),
      code: 0,
    };
  } catch (error) {
    const { stdout, stderr, code } = error as PromisifiedExecException;
    if (!code) throw error;
    return {
      stdout: stripAnsi(stdout).replace(/\d{2}:\d{2}:\d{2}/g, "HH:MM:SS"),
      stderr: stripAnsi(stderr),
      code,
    };
  }
};
