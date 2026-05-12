import { Command, Flags } from "@oclif/core";
import { getMobileClient } from "../../../autify/mobile/getMobileClient";

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
    const client = getMobileClient(configDir, userAgent);
    const res = await client.uploadBuild(flags["project-id"], flags.file);
    console.log(JSON.stringify(res.data, null, 2));
  }
}
