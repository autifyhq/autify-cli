/* eslint-disable unicorn/filename-case */
import { get } from "../config";
import { CLIError } from "@oclif/errors";

const DEFAULT_INTERVAL_SECOND = 1;

export const getWaitIntervalSecond = (configDir: string): number => {
  const waitIntervalSecondString =
    get(configDir, "AUTIFY_TEST_WAIT_INTERVAL_SECOND") ??
    String(DEFAULT_INTERVAL_SECOND);
  const waitIntervalSecond = Number.parseFloat(waitIntervalSecondString);
  if (waitIntervalSecond < 1)
    throw new CLIError("wait interval second should be greater than 1");
  if (Number.isNaN(waitIntervalSecond)) return DEFAULT_INTERVAL_SECOND;
  return waitIntervalSecond;
};
