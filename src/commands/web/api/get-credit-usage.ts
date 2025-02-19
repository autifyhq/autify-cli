import { Command, Flags } from "@oclif/core";
import { getWebClient } from "../../../autify/web/getWebClient";

export default class WebApiGetCreditUsage extends Command {
  static description =
    "Get the number of credits used in the project  Notes: This endpoint works only for organizations on credit-based plans. It always returns 0 for `credits_consumed` and `credit_consumption_event_count` if your organization is on a run-based plan.";
  static examples = ["<%= config.bin %> <%= command.id %>"];
  static flags = {
    "project-id": Flags.integer({
      description:
        "For example, 1 for the following URL: https://app.autify.com/projects/1/credits",
      required: true,
    }),
    "date-from": Flags.string({
      description:
        'The date to start counting used credits from. If not specified, the date will be set to 1 week ago. Up to 90 days in advance can be specified. If the specified date is more than 90 days in the past, the date will be set to 90 days ago. Date must follow the format YYYY-MM-DD (example: "2023-09-21").',
      required: false,
    }),
    "date-to": Flags.string({
      description:
        'The date to end counting used credits from. If not specified, the date will be set to today. Date must follow the format YYYY-MM-DD (example: "2023-09-28").',
      required: false,
    }),
    "scenario-id": Flags.integer({
      description: "The scenario ID to filter used credits by.",
      required: false,
    }),
    "test-plan-id": Flags.integer({
      description: "The test plan ID to filter used credits by.",
      required: false,
    }),
    "user-id": Flags.integer({
      description: "The user ID that executed tests to filter used credits by.",
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(WebApiGetCreditUsage);
    const { configDir, userAgent } = this.config;
    const client = getWebClient(configDir, userAgent);
    const res = await client.getCreditUsage(
      flags["project-id"],
      flags["date-from"],
      flags["date-to"],
      flags["scenario-id"],
      flags["test-plan-id"],
      flags["user-id"]
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
