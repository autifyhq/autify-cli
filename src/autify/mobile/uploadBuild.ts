/* eslint-disable unicorn/filename-case */
import { MobileClient } from "@autifyhq/autify-sdk";
import { Errors } from "@oclif/core";
import { inspectBuildFile } from "./inspectBuildFile";

export const uploadBuild = async (
  client: MobileClient,
  workspaceId: string,
  buildPath: string
): Promise<[string, "ios" | "android"]> => {
  const [uploadPath, os] = await inspectBuildFile(buildPath);
  const res = await client.uploadBuild(workspaceId, uploadPath);
  if (!res.data.id) throw new Errors.CLIError(`Failed to upload ${buildPath}.`);
  return [res.data.id, os];
};
