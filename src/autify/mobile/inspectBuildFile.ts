/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";
import { lstatSync } from "node:fs";

import { createZip } from "./createZip";

const isIosApp = (buildPath: string) =>
  lstatSync(buildPath).isDirectory() &&
  buildPath.replace(/\/$/, "").endsWith(".app");

const isAndroidApp = (buildPath: string) =>
  lstatSync(buildPath).isFile() && buildPath.endsWith(".apk");

const getOs = (buildPath: string) => {
  if (isIosApp(buildPath)) return "ios";
  if (isAndroidApp(buildPath)) return "android";
  throw new CLIError(`${buildPath} doesn't look like iOS app nor Android apk.`);
};

const getUploadPath = async (buildPath: string, os: "android" | "ios") => {
  if (os === "ios") return createZip(buildPath);
  if (os === "android") return buildPath;
  throw new CLIError(`Invalid os: ${os}`);
};

export const inspectBuildFile = async (
  buildPath: string
): Promise<[string, "android" | "ios"]> => {
  const os = getOs(buildPath);
  const uploadPath = await getUploadPath(buildPath, os);
  return [uploadPath, os];
};
