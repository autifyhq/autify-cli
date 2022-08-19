import { MobileClient } from "@autifyhq/autify-sdk";
import { Command, Flags } from "@oclif/core";
import { CLIError } from "@oclif/errors";
import emoji from "node-emoji";
import { getMobileTestResultUrl } from "../../../autify/mobile/getTestResultUrl";
import { parseTestPlanUrl } from "../../../autify/mobile/parseTestPlanUrl";
import { get, getOrThrow } from "../../../config";
import MobileBuildUpload from "../build/upload";
import MobileTestWait from "./wait";

export default class MobileTestRun extends Command {
  static description = "Run a test plan.";

  static examples = [
    "Run a test plan with a build ID:\n<%= config.bin %> <%= command.id %> --build-id CCC https://mobile-app.autify.com/projects/AAA/test_plans/BBB",
    "Run a test plan with a new build file:\n<%= config.bin %> <%= command.id %> --build-path ./my.[app|apk] https://mobile-app.autify.com/projects/AAA/test_plans/BBB",
    "Run and wait a test plan:\n<%= config.bin %> <%= command.id %> --build-id CCC https://mobile-app.autify.com/projects/AAA/test_plans/BBB --wait --timeout 600",
  ];

  static flags = {
    "build-id": Flags.string({
      description: "ID of the already uploaded build.",
      exclusive: ["build-path"],
    }),
    "build-path": Flags.file({
      description: "File path to the iOS app (*.app) or Android app (*.apk).",
      exclusive: ["build-id"],
    }),
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
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(MobileTestRun);
    let buildId = flags["build-id"];
    const buildPath = flags["build-path"];
    const { configDir, userAgent } = this.config;
    const accessToken = getOrThrow(configDir, "AUTIFY_MOBILE_ACCESS_TOKEN");
    const basePath = get(configDir, "AUTIFY_MOBILE_BASE_PATH");
    const client = new MobileClient(accessToken, { basePath, userAgent });
    const { workspaceId, testPlanId } = parseTestPlanUrl(args["test-plan-url"]);
    if (buildPath) {
      const uploadArgs = ["--workspace-id", workspaceId, buildPath];
      const uploadCommand = new MobileBuildUpload(uploadArgs, this.config);
      buildId = (await uploadCommand.run()).buildId;
    }

    const res = await client.runTestPlan(testPlanId, {
      // eslint-disable-next-line camelcase
      build_id: buildId,
    });
    if (!res.data.id) throw new CLIError(`Failed to run a test plan.`);
    const testResultUrl = getMobileTestResultUrl(
      configDir,
      workspaceId,
      res.data.id
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
