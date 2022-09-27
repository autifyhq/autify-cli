import { Command, Flags } from "@oclif/core";
import { getMobileClient } from "../../../autify/mobile/getMobileClient";

export default class MobileApiDescribeTestResult extends Command {
  static description = "Get a test result.";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "project-id": Flags.string({
      description:
        "ID of the project from which the test results will be obtained.",
      required: true,
    }),
    id: Flags.string({ description: "Test Result ID.", required: true }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(MobileApiDescribeTestResult);
    const { configDir, userAgent } = this.config;
    const client = getMobileClient(configDir, userAgent);
    const res = await client.describeTestResult(flags["project-id"], flags.id);
    console.log(JSON.stringify(res.data, null, 2));
  }
}
