import { Command, Flags } from "@oclif/core";

import { getWebClient } from "../../../autify/web/getWebClient";

export default class WebApiListResults extends Command {
  static description = "List test results.";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    page: Flags.integer({
      description: "The number of page returns.",
      required: false,
    }),
    "per-page": Flags.integer({
      description:
        "The number of items returns. Default number is 30 and up to a maximum of 100",
      required: false,
    }),
    "project-id": Flags.integer({
      description:
        "For example, 1 for the following URL: https://app.autify.com/projects/1/results",
      required: true,
    }),
    "test-plan-id": Flags.integer({
      description: "Test plan ID used to filter results.",
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(WebApiListResults);
    const { configDir, userAgent } = this.config;
    const client = getWebClient(configDir, userAgent);
    const res = await client.listResults(
      flags["project-id"],
      flags.page,
      flags["per-page"],
      flags["test-plan-id"]
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
