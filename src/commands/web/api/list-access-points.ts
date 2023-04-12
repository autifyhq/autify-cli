import { Command, Flags } from "@oclif/core";
import { getWebClient } from "../../../autify/web/getWebClient.js";

export default class WebApiListAccessPoints extends Command {
  static description = "List access points for the project.";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "project-id": Flags.integer({
      description:
        "For example, 1 for the following URL: https://app.autify.com/projects/1/scenarios",
      required: true,
    }),
    page: Flags.integer({
      description: "The number of page returns.",
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(WebApiListAccessPoints);
    const { configDir, userAgent } = this.config;
    const client = getWebClient(configDir, userAgent);
    const res = await client.listAccessPoints(flags["project-id"], flags.page);
    console.log(JSON.stringify(res.data, null, 2));
  }
}
