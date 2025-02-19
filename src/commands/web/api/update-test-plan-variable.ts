import { Command, Flags } from "@oclif/core";
import { getWebClient } from "../../../autify/web/getWebClient";

export default class WebApiUpdateTestPlanVariable extends Command {
  static description = "Update a url replacement for the test plan";
  static examples = ["<%= config.bin %> <%= command.id %>"];
  static flags = {
    "test-plan-id": Flags.integer({
      description:
        "For example, 15 for the following URL: https://app.autify.com/projects/1/test_plans/15",
      required: true,
    }),
    "test-plan-variable-id": Flags.integer({
      description: "test_plan_variable id",
      required: true,
    }),
    "update-test-plan-variable-request": Flags.string({
      description:
        'A JSON object with the variable\'s new key and/or default_value\'s value to register e.g. {"key":"string","default_value":"string"}',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(WebApiUpdateTestPlanVariable);
    const { configDir, userAgent } = this.config;
    const client = getWebClient(configDir, userAgent);
    const res = await client.updateTestPlanVariable(
      flags["test-plan-id"],
      flags["test-plan-variable-id"],
      JSON.parse(flags["update-test-plan-variable-request"])
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
