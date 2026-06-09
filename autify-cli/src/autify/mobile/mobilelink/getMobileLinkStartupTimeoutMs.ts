/* eslint-disable unicorn/filename-case */
import { get } from "../../../config";

const DEFAULT_STARTUP_TIMEOUT_MS = 30_000;

export const getMobileLinkStartupTimeoutMs = (configDir: string): number => {
  const value = get(configDir, "AUTIFY_MOBILE_LINK_STARTUP_TIMEOUT");
  if (!value) return DEFAULT_STARTUP_TIMEOUT_MS;

  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_STARTUP_TIMEOUT_MS;
  }

  return parsed;
};
