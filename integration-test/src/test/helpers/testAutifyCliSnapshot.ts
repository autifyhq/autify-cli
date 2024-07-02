/* eslint-disable unicorn/filename-case */
import { execAutifyCli } from "../helpers/execAutifyCli";

export const testAutifyCliSnapshot = (command: string, name?: string): void => {
  test(`autify ${name || command}`, async () => {
    expect(await execAutifyCli(command)).toMatchSnapshot();
  }, 300_000);
};
