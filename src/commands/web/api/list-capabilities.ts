import { Command, Flags } from "@oclif/core";
import { WebClient as Client } from "@autifyhq/autify-sdk";
import { get, getOrThrow } from "../../../config";

export default class WebApiListCapabilities extends Command {
  static description = "List available Capabilities.";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "project-id": Flags.integer({
      description:
        "For example, 1 for the following URL: https://app.autify.com/projects/1/capabilities",
      required: true,
    }),
    os: Flags.string({ description: "os name to filter", required: false }),
    browser: Flags.string({
      description: "browser name to filter",
      required: false,
    }),
    "device-type": Flags.string({
      description: "device_type name to filter",
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(WebApiListCapabilities);
    const { configDir, userAgent } = this.config;
    const accessToken = getOrThrow(configDir, "AUTIFY_WEB_ACCESS_TOKEN");
    const basePath = get(configDir, "AUTIFY_WEB_BASE_PATH");
    const client = new Client(accessToken, { basePath, userAgent });
    const res = await client.listCapabilities(
      flags["project-id"],
      flags.os,
      flags.browser,
      flags["device-type"]
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
