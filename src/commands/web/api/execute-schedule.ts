import { Command, Flags } from "@oclif/core";
import { getWebClient } from "../../../autify/web/getWebClient";

export default class WebApiExecuteSchedule extends Command {
  static description =
    '"Schedule" is called as "Test Plan" now. If you want to run a test plan, use this endpoint.';

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "schedule-id": Flags.integer({
      description:
        "For example, 3 for the following URL: https://app.autify.com/projects/1/test_plans/3",
      required: true,
    }),
    "execute-schedule-request": Flags.string({
      description: "The options to execute a test plan.",
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(WebApiExecuteSchedule);
    const { configDir, userAgent } = this.config;
    const client = getWebClient(configDir, userAgent);
    const res = await client.executeSchedule(
      flags["schedule-id"],
      flags["execute-schedule-request"]
        ? JSON.parse(flags["execute-schedule-request"])
        : undefined
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
