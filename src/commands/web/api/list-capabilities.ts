import { Command, Flags } from "@oclif/core";
import { getWebClient } from "../../../autify/web/getWebClient";

export default class WebApiListCapabilities extends Command {
  static description = "List available Capabilities.";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "project-id": Flags.integer({
      description:
        "For example, 1 for the following URL: https://app.autify.com/projects/1/capabilities",
      required: true,
    }),
    os: Flags.string({
      description: "os name to filter (deprecated)",
      required: false,
    }),
    "os-type": Flags.string({
      description: "Type of the os to filter",
      required: false,
    }),
    browser: Flags.string({
      description: "browser name to filter (deprecated)",
      required: false,
    }),
    "browser-type": Flags.string({
      description: "Type of the browser to filter",
      required: false,
    }),
    "device-type": Flags.string({
      description: "device_type name to filter (mobile is deprecated)",
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(WebApiListCapabilities);
    const { configDir, userAgent } = this.config;
    const client = getWebClient(configDir, userAgent);
    const res = await client.listCapabilities(
      flags["project-id"],
      flags.os,
      flags["os-type"] ? JSON.parse(flags["os-type"]) : undefined,
      flags.browser,
      flags["browser-type"] ? JSON.parse(flags["browser-type"]) : undefined,
      flags["device-type"] ? JSON.parse(flags["device-type"]) : undefined
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
