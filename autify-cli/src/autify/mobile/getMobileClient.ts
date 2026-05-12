/* eslint-disable unicorn/filename-case */
import http from "node:http";
import https from "node:https";
import axios from "axios";
import { MobileClient } from "@autifyhq/autify-sdk";
import { get, getOrThrow } from "../../config";

export const getMobileClient = (
  configDir: string,
  userAgent: string
): MobileClient => {
  // Node.js v19+ changed http.globalAgent to keepAlive: true by default.
  // @autifyhq/autify-sdk uses the global axios instance, which reuses sockets
  // across polling requests, eventually emitting a MaxListenersExceededWarning.
  axios.defaults.httpAgent = new http.Agent({ keepAlive: false });
  axios.defaults.httpsAgent = new https.Agent({ keepAlive: false });

  const accessToken = getOrThrow(configDir, "AUTIFY_MOBILE_ACCESS_TOKEN");
  const basePath = get(configDir, "AUTIFY_MOBILE_BASE_PATH");
  const userAgentSuffix = get(configDir, "AUTIFY_CLI_USER_AGENT_SUFFIX") ?? "";
  return new MobileClient(accessToken, {
    basePath,
    userAgent: `${userAgent} ${userAgentSuffix}`.trim(),
  });
};
