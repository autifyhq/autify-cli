/* eslint-disable unicorn/filename-case */
import { WEB_BASE_PATH } from "@autifyhq/autify-sdk";
import { get } from "../../config";

export const getWebTestResultUrl = (
  configDir: string,
  workspaceId: number,
  resultId: number
): string => {
  // Currently, it's heuristic. We could provide a new API or include the URL in the response of the existing APIs.
  let basePath = get(configDir, "AUTIFY_WEB_BASE_PATH") ?? WEB_BASE_PATH;
  if (basePath.startsWith("http://localhost:")) basePath = WEB_BASE_PATH; // Override if it's running integration tests.
  const endpoint = basePath.slice(0, Math.max(0, basePath.indexOf("/api/v1"))); // Assuming the UI endpoint is the same as API endpoint.
  return `${endpoint}/projects/${workspaceId}/results/${resultId}`;
};
