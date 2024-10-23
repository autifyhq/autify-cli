import { Command, Args, Flags } from "@oclif/core";
import * as emoji from "node-emoji";
import { parseTestResultUrl } from "../../../autify/web/parseTestResultUrl";
import { waitTestResult } from "../../../autify/web/waitTestResult";
import { getWebTestResultUrl } from "../../../autify/web/getTestResultUrl";
import { getWaitIntervalSecond } from "../../../autify/getWaitIntervalSecond";
import { getWebClient } from "../../../autify/web/getWebClient";

export default class WebTestWait extends Command {
  static description = "Wait a test result until it finishes.";

  static examples = [
    "<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/results/0000",
  ];

  static flags = {
    timeout: Flags.integer({
      char: "t",
      description:
        "Timeout seconds when waiting for the finish of the test execution.",
      default: 300,
    }),
    verbose: Flags.boolean({
      char: "v",
      description: "Verbose output",
      default: false,
    }),
  };

  static args = {
    "test-result-url": Args.string({
      description:
        "Test result URL e.g. https://app.autify.com/projects/<ID>/results/<ID>",
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(WebTestWait);
    const { configDir, userAgent } = this.config;
    const waitIntervalSecond = getWaitIntervalSecond(configDir);
    const client = getWebClient(configDir, userAgent);
    const { workspaceId, resultId } = parseTestResultUrl(
      args["test-result-url"]
    );
    const testResultUrl = getWebTestResultUrl(configDir, workspaceId, resultId);
    this.log(
      `${emoji.get("clock1")} Waiting for the test result: ${testResultUrl}`
    );
    const { isPassed, data } = await waitTestResult(
      client,
      workspaceId,
      resultId,
      {
        timeoutSecond: flags.timeout,
        verbose: flags.verbose,
        intervalSecond: waitIntervalSecond,
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
