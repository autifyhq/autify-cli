import { MobileClient } from "@autifyhq/autify-sdk";
import { Command, Flags } from "@oclif/core";
import emoji from "node-emoji";
import { getMobileTestResultUrl } from "../../../autify/mobile/getTestResultUrl";
import { parseTestResultUrl } from "../../../autify/mobile/parseTestResultUrl";
import { waitTestResult } from "../../../autify/mobile/waitTestResult";
import { get, getOrThrow } from "../../../config";

export default class MobileTestWait extends Command {
  static description = "Wait a test result until it finishes.";

  static examples = [
    "<%= config.bin %> <%= command.id %> https://mobile-app.autify.com/projects/AAA/results/BBB",
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

  static args = [
    {
      name: "test-result-url",
      description:
        "Test result URL e.g. https://mobile-app.autify.com/projects/<ID>/results/<ID>",
      required: true,
    },
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(MobileTestWait);
    const { configDir, userAgent } = this.config;
    const accessToken = getOrThrow(configDir, "AUTIFY_MOBILE_ACCESS_TOKEN");
    const basePath = get(configDir, "AUTIFY_MOBILE_BASE_PATH");
    const client = new MobileClient(accessToken, { basePath, userAgent });
    const { workspaceId, resultId } = parseTestResultUrl(
      args["test-result-url"]
    );
    const testResultUrl = getMobileTestResultUrl(
      configDir,
      workspaceId,
      resultId
    );
    this.log(
      `${emoji.get("clock1")} Waiting for the test result: ${testResultUrl}`
    );
    const { isPassed, data } = await waitTestResult(
      client,
      workspaceId,
      resultId,
      { timeoutSecond: flags.timeout, verbose: flags.verbose }
    );
    if (isPassed) {
      this.log(
        `${emoji.get("white_check_mark")} Test passed!: ${testResultUrl}`
      );
      this.exit();
    } else {
      this.error(
        `${emoji.get(
          "x"
        )} Test didn't pass. See ${testResultUrl}: ${JSON.stringify(data)}`
      );
    }
  }
}
