import { Command, Flags } from "@oclif/core";
import { getWebClient } from "../../../autify/web/getWebClient";

export default class WebApiDeleteTestPlanVariable extends Command {
  static description =
    "Delete an existing test plan variable for the test plan";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "test-plan-id": Flags.integer({
      description:
        "For example, 15 for the following URL: https://app.autify.com/projects/1/test_plans/15/",
      required: true,
    }),
    "test-plan-variable-id": Flags.integer({
      description: "test_plan_variable id",
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(WebApiDeleteTestPlanVariable);
    const { configDir, userAgent } = this.config;
    const client = getWebClient(configDir, userAgent);
    const res = await client.deleteTestPlanVariable(
      flags["test-plan-id"],
      flags["test-plan-variable-id"]
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
