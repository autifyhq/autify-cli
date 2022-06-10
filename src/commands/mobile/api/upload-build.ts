import { Command, Flags } from "@oclif/core";
import { MobileClient as Client } from "@autifyhq/autify-sdk";
import { get, getOrThrow } from "../../../config";

export default class MobileApiUploadBuild extends Command {
  static description = "Upload the build file.";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "project-id": Flags.string({
      description: "The ID of the project to upload the build file to.",
      required: true,
    }),
    file: Flags.string({ description: "Build file.", required: true }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(MobileApiUploadBuild);
    const { configDir, userAgent } = this.config;
    const accessToken = getOrThrow(configDir, "AUTIFY_MOBILE_ACCESS_TOKEN");
    const basePath = get(configDir, "AUTIFY_MOBILE_BASE_PATH");
    const client = new Client(accessToken, { basePath, userAgent });
    const res = await client.uploadBuild(flags["project-id"], flags.file);
    console.log(JSON.stringify(res.data, null, 2));
  }
}
