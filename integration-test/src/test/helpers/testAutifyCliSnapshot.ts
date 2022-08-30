/* eslint-disable unicorn/filename-case */
import { platform } from "node:process";
import { execAutifyCli } from "../helpers/execAutifyCli";

const isSkip = (command: string) => {
  // Windows doesn't support autify mobile with iOS app upload so far.
  if (
    platform === "win32" &&
    command.startsWith("mobile") &&
    command.includes(".app")
  ) {
    return true;
  }

  return false;
};

export const testAutifyCliSnapshot = (command: string): void => {
  (isSkip(command) ? test.skip : test)(
    `autify ${command}`,
    async () => {
      expect(await execAutifyCli(command)).toMatchSnapshot();
    },
    300_000
  );
};
