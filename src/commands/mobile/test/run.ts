import { MobileClient } from "@autifyhq/autify-sdk";
import { Command, Flags } from "@oclif/core";
import emoji from "node-emoji";
import { getMobileTestResultUrl } from "../../../autify/mobile/getTestResultUrl";
import { runTest } from "../../../autify/mobile/runTest";
import { get, getOrThrow } from "../../../config";
import MobileTestWait from "./wait";

export default class MobileTestRun extends Command {
  static description = "Run a test plan.";

  static examples = [
    "Run a test plan:\n<%= config.bin %> <%= command.id %> https://mobile-app.autify.com/projects/AAA/test_plans/BBB ./my.app",
    "Run and wait a test plan:\n<%= config.bin %> <%= command.id %> https://mobile-app.autify.com/projects/AAA/test_plans/BBB ./my.app --wait --timeout 600",
  ];

  static flags = {
    wait: Flags.boolean({
      char: "w",
      description: "Wait until the test finishes.",
      default: false,
    }),
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
      name: "test-plan-url",
      description:
        "Test plan URL e.g. https://mobile-app.autify.com/projects/<ID>/test_plans/<ID>",
      required: true,
    },
    {
      name: "build-path",
      description: "File path to the iOS app (*.app) or Android app (*.apk).",
      required: true,
    },
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(MobileTestRun);
    const { configDir, userAgent } = this.config;
    const accessToken = getOrThrow(configDir, "AUTIFY_MOBILE_ACCESS_TOKEN");
    const basePath = get(configDir, "AUTIFY_MOBILE_BASE_PATH");
    const client = new MobileClient(accessToken, { basePath, userAgent });
    const { workspaceId, resultId } = await runTest(
      client,
      args["test-plan-url"],
      args["build-path"]
    );
    const testResultUrl = getMobileTestResultUrl(
      configDir,
      workspaceId,
      resultId
    );
    this.log(
      `${emoji.get("white_check_mark")} Successfully started: ${testResultUrl}`
    );
    if (flags.wait) {
      const waitArgs = ["--timeout", flags.timeout.toString(), testResultUrl];
      if (flags.verbose) waitArgs.push("--verbose");
      await MobileTestWait.run(waitArgs);
    } else {
      this.log("To wait for the test result, run the command below:");
      this.log(
        `${emoji.get("computer")} $ autify mobile test wait ${testResultUrl}`
      );
    }
  }
}
