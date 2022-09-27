import { Command, Flags } from "@oclif/core";
import { getWebClient } from "../../../autify/web/getWebClient";

export default class WebApiCreateUrlReplacement extends Command {
  static description = "Create a new url replacement for the test plan";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "test-plan-id": Flags.integer({
      description:
        "For example, 15 for the following URL: https://app.autify.com/projects/1/test_plans/15",
      required: true,
    }),
    "create-url-replacement-request": Flags.string({
      description: "The url to replace",
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(WebApiCreateUrlReplacement);
    const { configDir, userAgent } = this.config;
    const client = getWebClient(configDir, userAgent);
    const res = await client.createUrlReplacement(
      flags["test-plan-id"],
      JSON.parse(flags["create-url-replacement-request"])
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
