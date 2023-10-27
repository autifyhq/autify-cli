import { Command, Flags } from "@oclif/core";

import { getMobileClient } from "../../../autify/mobile/getMobileClient";

export default class MobileApiRunTestPlan extends Command {
  static description = "Run a test plan";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "run-test-plan-request": Flags.string({
      description: "The build_id to execute the test plan.",
      required: true,
    }),
    "test-plan-id": Flags.string({
      description: "The ID of the test plan to run.",
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(MobileApiRunTestPlan);
    const { configDir, userAgent } = this.config;
    const client = getMobileClient(configDir, userAgent);
    const res = await client.runTestPlan(
      flags["test-plan-id"],
      JSON.parse(flags["run-test-plan-request"])
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
