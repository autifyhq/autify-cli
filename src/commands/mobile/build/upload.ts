import { Command, Args, Flags } from "@oclif/core";
import * as emoji from "node-emoji";
import { getBuildDetailUrl } from "../../../autify/mobile/getBuildDetailUrl";
import { getMobileClient } from "../../../autify/mobile/getMobileClient";
import { uploadBuild } from "../../../autify/mobile/uploadBuild";

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
  static args = {
    "build-path": Args.string({
      description:
        "File path to the iOS app (*.app, *.ipa) or Android app (*.apk).",
      required: true,
    }),
  };

  public async run(): Promise<{ buildId: string }> {
    const { args, flags } = await this.parse(MobileBuildUpload);
    const buildPath = args["build-path"];
    const workspaceId = flags["workspace-id"];
    const { configDir, userAgent } = this.config;
    const client = getMobileClient(configDir, userAgent);
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
