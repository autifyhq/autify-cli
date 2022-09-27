/* eslint-disable unicorn/filename-case */
import { MobileClient } from "@autifyhq/autify-sdk";
import { get, getOrThrow } from "../../config";

export const getMobileClient = (
  configDir: string,
  userAgent: string
): MobileClient => {
  const accessToken = getOrThrow(configDir, "AUTIFY_MOBILE_ACCESS_TOKEN");
  const basePath = get(configDir, "AUTIFY_MOBILE_BASE_PATH");
  const userAgentSuffix = get(configDir, "AUTIFY_CLI_USER_AGENT_SUFFIX") ?? "";
  return new MobileClient(accessToken, {
    basePath,
    userAgent: `${userAgent} ${userAgentSuffix}`.trim(),
  });
};
