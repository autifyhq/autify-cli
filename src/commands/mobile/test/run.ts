import { Command, Args, Flags } from "@oclif/core";
import { CLIError } from "@oclif/errors";
import emoji from "node-emoji";
import { getMobileClient } from "../../../autify/mobile/getMobileClient.js";
import { getMobileTestResultUrl } from "../../../autify/mobile/getTestResultUrl.js";
import { parseTestPlanUrl } from "../../../autify/mobile/parseTestPlanUrl.js";
import MobileBuildUpload from "../build/upload.js";
import MobileTestWait from "./wait.js";

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
    "max-retry-count": Flags.integer({
      description:
        "Maximum retry count. The command can take up to timeout * (max-retry-count + 1).",
      default: 0,
    }),
  };

  static args = {
    "test-plan-url": Args.string({
      description:
        "Test plan URL e.g. https://mobile-app.autify.com/projects/<ID>/test_plans/<ID>",
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(MobileTestRun);
    let buildId = flags["build-id"];
    const buildPath = flags["build-path"];
    const { configDir, userAgent } = this.config;
    const client = getMobileClient(configDir, userAgent);
    const { workspaceId, testPlanId } = parseTestPlanUrl(args["test-plan-url"]);
    if (buildPath) {
      const uploadArgs = ["--workspace-id", workspaceId, buildPath];
      const uploadCommand = new MobileBuildUpload(uploadArgs, this.config);
      const res = await uploadCommand.run();
      buildId = res.buildId;
    }

    const runTestPlanOnce = async () => {
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
        `${emoji.get(
          "white_check_mark"
        )} Successfully started: ${testResultUrl}`
      );
      return testResultUrl;
    };

    let testResultUrl = await runTestPlanOnce();

    if (flags.wait) {
      const mobileTestWait = async (url: string) => {
        const waitArgs = ["--timeout", flags.timeout.toString(), url];
        if (flags.verbose) waitArgs.push("--verbose");
        try {
          await MobileTestWait.run(waitArgs);
        } catch (error) {
          if ((error as CLIError).oclif.exit === 0) return null;
          return error as Error;
        }

        throw new CLIError(`Unexpected behavior.`);
      };

      const maxRetryCount = flags["max-retry-count"];
      let error: Error | null;
      for await (const [i] of Array.from({
        length: maxRetryCount + 1,
      }).entries()) {
        error = await mobileTestWait(testResultUrl);
        if (error === null) this.exit();
        else if (i === maxRetryCount) throw error;
        else {
          this.log(
            `${emoji.get("repeat")} Retrying... (attempt: ${
              i + 1
            }/${maxRetryCount})`
          );
          testResultUrl = await runTestPlanOnce();
        }
      }
    } else {
      this.log("To wait for the test result, run the command below:");
      this.log(
        `${emoji.get("computer")} $ autify mobile test wait ${testResultUrl}`
      );
    }
  }
}
