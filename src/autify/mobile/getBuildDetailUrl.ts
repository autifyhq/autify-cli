/* eslint-disable unicorn/filename-case */
import { MOBILE_BASE_PATH } from "@autifyhq/autify-sdk";
import { get } from "../../config";

export const getBuildDetailUrl = (
  configDir: string,
  workspaceId: string,
  os: "ios" | "android",
  buildId: string
): string => {
  // Currently, it's heuristic. We could provide a new API or include the URL in the response of the existing APIs.
  let basePath = get(configDir, "AUTIFY_MOBILE_BASE_PATH") ?? MOBILE_BASE_PATH;
  if (basePath.startsWith("http://127.0.0.1:")) basePath = MOBILE_BASE_PATH; // Override if it's running integration tests.
  const endpoint = basePath.slice(0, Math.max(0, basePath.indexOf("/api/v1"))); // Assuming the UI endpoint is the same as API endpoint.
  // Currently, there is no way to know the page number via API. We assume the latest build will be shown in page 1 now.
  return `${endpoint}/projects/${workspaceId}/builds?os=${os}&selectedBuildId=${buildId}&page=1`;
};
