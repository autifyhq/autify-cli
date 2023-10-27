import { Args, Command, Flags } from "@oclif/core";
import { get } from "node-emoji";

import { getWaitIntervalSecond } from "../../../autify/getWaitIntervalSecond";
import { getMobileClient } from "../../../autify/mobile/getMobileClient";
import { getMobileTestResultUrl } from "../../../autify/mobile/getTestResultUrl";
import { parseTestResultUrl } from "../../../autify/mobile/parseTestResultUrl";
import { waitTestResult } from "../../../autify/mobile/waitTestResult";

export default class MobileTestWait extends Command {
  static args = {
    "test-result-url": Args.string({
      description:
        "Test result URL e.g. https://mobile-app.autify.com/projects/<ID>/results/<ID>",
      required: true,
    }),
  };

  static description = "Wait a test result until it finishes.";

  static examples = [
    "<%= config.bin %> <%= command.id %> https://mobile-app.autify.com/projects/AAA/results/BBB",
  ];

  static flags = {
    timeout: Flags.integer({
      char: "t",
      default: 300,
      description:
        "Timeout seconds when waiting for the finish of the test execution.",
    }),
    verbose: Flags.boolean({
      char: "v",
      default: false,
      description: "Verbose output",
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(MobileTestWait);
    const { configDir, userAgent } = this.config;
    const waitIntervalSecond = getWaitIntervalSecond(configDir);
    const client = getMobileClient(configDir, userAgent);
    const { resultId, workspaceId } = parseTestResultUrl(
      args["test-result-url"]
    );
    const testResultUrl = getMobileTestResultUrl(
      configDir,
      workspaceId,
      resultId
    );
    this.log(`${get("clock1")} Waiting for the test result: ${testResultUrl}`);
    const { data, isPassed } = await waitTestResult(
      client,
      workspaceId,
      resultId,
      {
        intervalSecond: waitIntervalSecond,
        timeoutSecond: flags.timeout,
        verbose: flags.verbose,
      }
    );
    if (isPassed) {
      this.log(`${get("white_check_mark")} Test passed!: ${testResultUrl}`);
      this.exit();
    } else {
      this.log(
        `${get("x")} Test didn't pass. See ${testResultUrl}: ${JSON.stringify(
          data
        )}`
      );
      this.exit(1);
    }
  }
}
