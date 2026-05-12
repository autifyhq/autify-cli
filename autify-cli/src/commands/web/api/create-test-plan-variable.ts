import { Command, Flags } from "@oclif/core";
import { getWebClient } from "../../../autify/web/getWebClient";

export default class WebApiCreateTestPlanVariable extends Command {
  static description = "Create a new variable for the test plan";
  static examples = ["<%= config.bin %> <%= command.id %>"];
  static flags = {
    "test-plan-id": Flags.integer({
      description:
        "For example, 15 for the following URL: https://app.autify.com/projects/1/test_plans/15",
      required: true,
    }),
    "create-test-plan-variable-request": Flags.string({
      description:
        'A JSON object with the new variable key and default value to use in the test plan e.g. {"key":"string","default_value":"string"}',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(WebApiCreateTestPlanVariable);
    const { configDir, userAgent } = this.config;
    const client = getWebClient(configDir, userAgent);
    const res = await client.createTestPlanVariable(
      flags["test-plan-id"],
      JSON.parse(flags["create-test-plan-variable-request"])
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
