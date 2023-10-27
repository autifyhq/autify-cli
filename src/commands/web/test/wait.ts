import { Args, Command, Flags } from "@oclif/core";
import emoji from "node-emoji";

import { getWaitIntervalSecond } from "../../../autify/getWaitIntervalSecond";
import { getWebTestResultUrl } from "../../../autify/web/getTestResultUrl";
import { getWebClient } from "../../../autify/web/getWebClient";
import { parseTestResultUrl } from "../../../autify/web/parseTestResultUrl";
import { waitTestResult } from "../../../autify/web/waitTestResult";

export default class WebTestWait extends Command {
  static args = {
    "test-result-url": Args.string({
      description:
        "Test result URL e.g. https://app.autify.com/projects/<ID>/results/<ID>",
      required: true,
    }),
  };

  static description = "Wait a test result until it finishes.";

  static examples = [
    "<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/results/0000",
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
    const { args, flags } = await this.parse(WebTestWait);
    const { configDir, userAgent } = this.config;
    const waitIntervalSecond = getWaitIntervalSecond(configDir);
    const client = getWebClient(configDir, userAgent);
    const { resultId, workspaceId } = parseTestResultUrl(
      args["test-result-url"]
    );
    const testResultUrl = getWebTestResultUrl(configDir, workspaceId, resultId);
    this.log(
      `${emoji.get("clock1")} Waiting for the test result: ${testResultUrl}`
    );
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
      this.log(
        `${emoji.get("white_check_mark")} Test passed!: ${testResultUrl}`
      );
      this.exit();
    } else {
      this.log(
        `${emoji.get(
          "x"
        )} Test didn't pass. See ${testResultUrl}: ${JSON.stringify(data)}`
      );
      this.exit(1);
    }
  }
}
