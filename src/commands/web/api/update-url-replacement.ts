import { Command, Flags } from "@oclif/core";

import { getWebClient } from "../../../autify/web/getWebClient";

export default class WebApiUpdateUrlReplacement extends Command {
  static description = "Update a url replacement for the test plan";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "test-plan-id": Flags.integer({
      description:
        "For example, 15 for the following URL: https://app.autify.com/projects/1/test_plans/15",
      required: true,
    }),
    "update-url-replacement-request": Flags.string({
      description:
        "The url to replace. Either pattern_url or replacement_url is required.",
      required: true,
    }),
    "url-replacement-id": Flags.integer({
      description: "url_replacement id",
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(WebApiUpdateUrlReplacement);
    const { configDir, userAgent } = this.config;
    const client = getWebClient(configDir, userAgent);
    const res = await client.updateUrlReplacement(
      flags["test-plan-id"],
      flags["url-replacement-id"],
      JSON.parse(flags["update-url-replacement-request"])
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
