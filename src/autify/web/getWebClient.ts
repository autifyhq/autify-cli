/* eslint-disable unicorn/filename-case */
import { WebClient } from "@autifyhq/autify-sdk";
import { get, getOrThrow } from "../../config";

export const getWebClient = (
  configDir: string,
  userAgent: string
): WebClient => {
  const accessToken = getOrThrow(configDir, "AUTIFY_WEB_ACCESS_TOKEN");
  const basePath = get(configDir, "AUTIFY_WEB_BASE_PATH");
  const userAgentSuffix = get(configDir, "AUTIFY_CLI_USER_AGENT_SUFFIX") ?? "";
  return new WebClient(accessToken, {
    basePath,
    userAgent: `${userAgent} ${userAgentSuffix}`.trim(),
  });
};
