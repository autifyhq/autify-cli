/* eslint-disable unicorn/filename-case */
import { execAutifyCli } from "../helpers/execAutifyCli";

export const testAutifyCliSnapshot = (command: string): void => {
  test(`autify ${command}`, async () => {
    expect(await execAutifyCli(command)).toMatchSnapshot();
  }, 300_000);
};
