import { MobileClient } from "@autifyhq/autify-sdk";
import { Command, Flags } from "@oclif/core";
import emoji from "node-emoji";
import { getBuildDetailUrl } from "../../../autify/mobile/getBuildDetailUrl";
import { uploadBuild } from "../../../autify/mobile/uploadBuild";
import { get, getOrThrow } from "../../../config";

export default class MobileBuildUpload extends Command {
  static enableJsonFlag = true;

  static description = "Upload a build file";

  static examples = [
    "<%= config.bin %> <%= command.id %>",
    "Upload build file\n<%= config.bin %> <%= command.id %> --workspace-id AAA ./my.app",
    "Upload build file (JSON output)\n<%= config.bin %> <%= command.id %> --workspace-id AAA ./my.app --json",
  ];

  static flags = {
    "workspace-id": Flags.string({
      char: "w",
      description: "Workspace ID to upload the build file",
      required: true,
    }),
  };

  static args = [
    {
      name: "build-path",
      description: "File path to the iOS app (*.app) or Android app (*.apk).",
      required: true,
    },
  ];

  public async run(): Promise<{ buildId: string }> {
    const { args, flags } = await this.parse(MobileBuildUpload);
    const buildPath = args["build-path"];
    const workspaceId = flags["workspace-id"];
    const { configDir, userAgent } = this.config;
    const accessToken = getOrThrow(configDir, "AUTIFY_MOBILE_ACCESS_TOKEN");
    const basePath = get(configDir, "AUTIFY_MOBILE_BASE_PATH");
    const client = new MobileClient(accessToken, { basePath, userAgent });
    const [buildId, os] = await uploadBuild(client, workspaceId, buildPath);
    const buildDetailUrl = getBuildDetailUrl(
      configDir,
      workspaceId,
      os,
      buildId
    );
    this.log(
      `${emoji.get(
        "white_check_mark"
      )} Successfully uploaded ${buildPath} (ID: ${buildId}). See ${buildDetailUrl}`
    );
    return { buildId };
  }
}
