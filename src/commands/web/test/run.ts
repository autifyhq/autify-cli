import { Args, Command, Flags } from "@oclif/core";
import { CLIError } from "@oclif/errors";
import emoji from "node-emoji";

import { ClientManager } from "../../../autify/connect/client-manager/ClientManager";
import { getWebTestResultUrl } from "../../../autify/web/getTestResultUrl";
import { getWebClient } from "../../../autify/web/getWebClient";
import { parseAutifyTestUrl } from "../../../autify/web/parseAutifyTestUrl";
import { runTest } from "../../../autify/web/runTest";
import WebTestWait from "./wait";

const urlReplacementsToString = (
  urlReplacements: { pattern_url: string; replacement_url: string }[]
) =>
  urlReplacements
    .map(
      (urlReplacement) =>
        `${urlReplacement.pattern_url} => ${urlReplacement.replacement_url}`
    )
    .join(", ");

export default class WebTestRun extends Command {
  static args = {
    "scenario-or-test-plan-url": Args.string({
      description:
        "Scenario URL or Test plan URL e.g. https://app.autify.com/projects/<ID>/(scenarios|test_plans)/<ID>",
      required: true,
    }),
  };

  static description = "Run a scenario or test plan.";

  static examples = [
    "Run a test scenario (Default capability):\n<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/scenarios/0000",
    "Run a test plan:\n<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/test_plans/0000",
    "Run and wait a test scenario:\n<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/scenarios/0000 --wait --timeout 600",
    'Run a test scenario with a specific capability:\n<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/scenarios/0000 --os "Windows Server" --browser Edge',
    'With URL replacements:\n<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/scenarios/0000 -r "http://example.com http://example.net" -r "http://example.org http://example.net"',
    'Run a test with specifying the execution name:\n<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/scenarios/0000 --name "Sample execution"',
    "Run a test scenario with Autify Connect:\n<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/scenarios/0000 --autify-connect NAME",
    "Run a test scenario with Autify Connect Client:\n<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/scenarios/0000 --wait --autify-connect-client",
  ];

  static flags = {
    "autify-connect": Flags.string({
      description: "Name of the Autify Connect Access Point.",
      exclusive: ["autify-connect-client"],
    }),
    "autify-connect-client": Flags.boolean({
      dependsOn: ["wait"],
      description: "Start Autify Connect Client",
      exclusive: ["autify-connect"],
    }),
    "autify-connect-client-debug-server-port": Flags.integer({
      dependsOn: ["autify-connect-client"],
      description:
        "Port for Autify Connect Client debug server. A random port will be used if not specified.",
    }),
    "autify-connect-client-extra-arguments": Flags.string({
      dependsOn: ["autify-connect-client"],
      description:
        'Extra command line arguments you want to pass to Autify Connect Client e.g. "--tunnel-proxy http://proxy".',
    }),
    "autify-connect-client-file-logging": Flags.boolean({
      dependsOn: ["autify-connect-client"],
      description:
        "Logging Autify Connect Client log to a file instead of console.",
    }),
    "autify-connect-client-verbose": Flags.boolean({
      dependsOn: ["autify-connect-client"],
      description: "Verbose output for Autify Connect Client.",
    }),
    browser: Flags.string({
      description: "[Only for test scenario] Browser to run the test",
    }),
    device: Flags.string({
      description: "[Only for test scenario] Device to run the test",
    }),
    "device-type": Flags.string({
      description: "[Only for test scenario] Device type to run the test",
    }),
    "max-retry-count": Flags.integer({
      default: 0,
      description:
        "Maximum retry count while waiting. The command can take up to `timeout * (max-retry-count + 1)`. Only effective with `--wait`.",
    }),
    name: Flags.string({
      char: "n",
      description: "[Only for test scenario] Name of the test execution.",
    }),
    os: Flags.string({
      description: "[Only for test scenario] OS to run the test",
    }),
    "os-version": Flags.string({
      description: "[Only for test scenario] OS version to run the test",
    }),
    timeout: Flags.integer({
      char: "t",
      default: 300,
      description:
        "Timeout seconds when waiting for the finish of the test execution.",
    }),
    "url-replacements": Flags.string({
      char: "r",
      description:
        'URL replacements. Example: "http://example.com http://example.net"',
      multiple: true,
    }),
    verbose: Flags.boolean({
      char: "v",
      default: false,
      description: "Verbose output",
    }),
    wait: Flags.boolean({
      char: "w",
      default: false,
      description: "Wait until the test finishes.",
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(WebTestRun);
    const capabilityOption = {
      browser: flags.browser,
      device: flags.device,
      // eslint-disable-next-line camelcase
      device_type: flags["device-type"],
      os: flags.os,
      // eslint-disable-next-line camelcase
      os_version: flags["os-version"],
    };
    const urlReplacements = this.parseUrlReplacements(
      flags["url-replacements"] ?? []
    );
    if (urlReplacements.length > 0)
      this.log(
        `${emoji.get("memo")} Using URL replacements: ${urlReplacementsToString(
          urlReplacements
        )}`
      );
    const { cacheDir, configDir, userAgent } = this.config;
    const client = getWebClient(configDir, userAgent);

    const parsedTest = parseAutifyTestUrl(args["scenario-or-test-plan-url"]);
    const { workspaceId } = parsedTest;

    let autifyConnectAccessPoint = flags["autify-connect"];
    let autifyConnectClientManager: ClientManager | undefined;

    const runTestOnce = async () => {
      const { capability, resultId } = await runTest(client, parsedTest, {
        autifyConnectAccessPoint,
        name: flags.name,
        option: capabilityOption,
        urlReplacements,
      });
      const testResultUrl = getWebTestResultUrl(
        configDir,
        workspaceId,
        resultId
      );
      this.log(
        `${emoji.get(
          "white_check_mark"
        )} Successfully started: ${testResultUrl} (Capability is ${capability})`
      );
      return testResultUrl;
    };

    try {
      if (flags["autify-connect-client"]) {
        autifyConnectClientManager = await ClientManager.create({
          cacheDir,
          configDir,
          debugServerPort: flags["autify-connect-client-debug-server-port"],
          extraArguments: flags["autify-connect-client-extra-arguments"],
          fileLogging: flags["autify-connect-client-file-logging"],
          userAgent,
          verbose: flags["autify-connect-client-verbose"],
          webWorkspaceId: workspaceId,
        });
        autifyConnectAccessPoint = autifyConnectClientManager.accessPointName;
        this.log("Starting Autify Connect Client...");
        await autifyConnectClientManager.start();
        this.log("Waiting until Autify Connect Client is ready...");
        await autifyConnectClientManager.onceReady();
        this.log("Autify Connect Client is ready!");
      }

      let testResultUrl = await runTestOnce();
      if (flags.wait) {
        const webTestWait = async (url: string) => {
          const waitArgs = ["--timeout", flags.timeout.toString(), url];
          if (flags.verbose) waitArgs.push("--verbose");
          try {
            await WebTestWait.run(waitArgs);
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
          error = await webTestWait(testResultUrl);
          if (error === null) this.exit();
          else if (i === maxRetryCount) throw error;
          else {
            this.log(
              `${emoji.get("repeat")} Retrying... (attempt: ${
                i + 1
              }/${maxRetryCount})`
            );
            testResultUrl = await runTestOnce();
          }
        }
      } else {
        this.log("To wait for the test result, run the command below:");
        this.log(
          `${emoji.get("computer")} $ autify web test wait ${testResultUrl}`
        );
      }
    } catch (error) {
      if (autifyConnectClientManager) {
        this.log("Waiting until Autify Connect Client exits...");
        await autifyConnectClientManager.exit({
          ignoreError: true,
        });
        this.log("Autify Connect Client exited.");
      }

      throw error;
    }
  }

  private parseUrlReplacements(urlReplacements: string[]) {
    return urlReplacements.map((s) => {
      // eslint-disable-next-line camelcase
      let pattern_url: string;
      // eslint-disable-next-line camelcase
      let replacement_url: string;
      let rest: string[];

      if (s.includes(" ")) {
        // eslint-disable-next-line camelcase
        [pattern_url, replacement_url] = s.split(" ");
      } else if (s.includes("=")) {
        // eslint-disable-next-line camelcase
        [pattern_url, ...rest] = s.split("=");
        // eslint-disable-next-line camelcase
        replacement_url = rest.join("=");

        this.warn(
          `Using = as a delimiter for --url-replacements (-r) option is deprecated. ` +
            // eslint-disable-next-line camelcase
            `Use space instead (--url-replacements "${pattern_url} ${replacement_url}").`
        );
      } else {
        throw new CLIError(
          `Can't parse ${s} as --url-replacements option. Please make sure it has a space as a delimiter and surrounded by quotes. (e.g. --url-replacements "https://example.com https://example.net")`
        );
      }

      // eslint-disable-next-line camelcase
      return { pattern_url, replacement_url };
    });
  }
}
