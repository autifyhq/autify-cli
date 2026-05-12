/* eslint-disable unicorn/filename-case */
import { get } from "../config";

const DEFAULT_INTERVAL_SECOND = 1;

export const getWaitIntervalSecond = (configDir: string): number => {
  const waitIntervalSecondString =
    get(configDir, "AUTIFY_TEST_WAIT_INTERVAL_SECOND") ??
    String(DEFAULT_INTERVAL_SECOND);
  const waitIntervalSecond = Number.parseFloat(waitIntervalSecondString);
  if (Number.isNaN(waitIntervalSecond)) return DEFAULT_INTERVAL_SECOND;
  return waitIntervalSecond;
};
