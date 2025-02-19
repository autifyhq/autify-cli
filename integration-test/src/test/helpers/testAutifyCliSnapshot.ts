/* eslint-disable unicorn/filename-case */
/* eslint-disable mocha/no-exports */
/* eslint-disable no-undef */
import { execAutifyCli } from "../helpers/execAutifyCli";

export const testAutifyCliSnapshot = (command: string): void => {
  test(`autify ${command}`, async () => {
    expect(await execAutifyCli(command)).toMatchSnapshot();
  }, 300_000);
};
