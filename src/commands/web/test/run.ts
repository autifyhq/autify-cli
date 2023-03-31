import { Command, Args, Flags } from "@oclif/core";
import emoji from "node-emoji";
import { runTest } from "../../../autify/web/runTest";
import { getWebTestResultUrl } from "../../../autify/web/getTestResultUrl";
import WebTestWait from "./wait";
import { CLIError } from "@oclif/errors";
import { parseAutifyTestUrl } from "../../../autify/web/parseAutifyTestUrl";
import { ClientManager } from "../../../autify/connect/client-manager/ClientManager";
import { getWebClient } from "../../../autify/web/getWebClient";

const urlReplacementsToString = (
  urlReplacements: { pattern_url: string; replacement_url: string }[]
) => {
  return urlReplacements
    .map((urlReplacement) => {
      return `${urlReplacement.pattern_url} => ${urlReplacement.replacement_url}`;
    })
    .join(", ");
};

export default class WebTestRun extends Command {
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
    name: Flags.string({
      char: "n",
      description: "[Only for test scenario] Name of the test execution.",
    }),
    "url-replacements": Flags.string({
      char: "r",
      description:
        'URL replacements. Example: "http://example.com http://example.net"',
      multiple: true,
    }),
    "autify-connect": Flags.string({
      description: "Name of the Autify Connect Access Point.",
      exclusive: ["autify-connect-client"],
    }),
    "autify-connect-client": Flags.boolean({
      description: "Start Autify Connect Client",
      exclusive: ["autify-connect"],
      dependsOn: ["wait"],
    }),
    "autify-connect-client-verbose": Flags.boolean({
      description: "Verbose output for Autify Connect Client.",
      dependsOn: ["autify-connect-client"],
    }),
    "autify-connect-client-file-logging": Flags.boolean({
      description:
        "Logging Autify Connect Client log to a file instead of console.",
      dependsOn: ["autify-connect-client"],
    }),
    "autify-connect-client-debug-server-port": Flags.integer({
      description:
        "Port for Autify Connect Client debug server. A random port will be used if not specified.",
      dependsOn: ["autify-connect-client"],
    }),
    "autify-connect-client-extra-arguments": Flags.string({
      description:
        'Extra command line arguments you want to pass to Autify Connect Client e.g. "--tunnel-proxy http://proxy".',
      dependsOn: ["autify-connect-client"],
    }),
    os: Flags.string({
      description: "[Only for test scenario] OS to run the test",
    }),
    "os-version": Flags.string({
      description: "[Only for test scenario] OS version to run the test",
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
        "Maximum retry count while waiting. The command can take up to `timeout * (max-retry-count + 1)`. Only effective with `--wait`.",
      default: 0,
    }),
  };

  static args = {
    "scenario-or-test-plan-url": Args.string({
      description:
        "Scenario URL or Test plan URL e.g. https://app.autify.com/projects/<ID>/(scenarios|test_plans)/<ID>",
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(WebTestRun);
    const capabilityOption = {
      os: flags.os,
      // eslint-disable-next-line camelcase
      os_version: flags["os-version"],
      browser: flags.browser,
      device: flags.device,
      // eslint-disable-next-line camelcase
      device_type: flags["device-type"],
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
    const { configDir, cacheDir, userAgent } = this.config;
    const client = getWebClient(configDir, userAgent);

    const parsedTest = parseAutifyTestUrl(args["scenario-or-test-plan-url"]);
    const { workspaceId } = parsedTest;

    let autifyConnectAccessPoint = flags["autify-connect"];
    let autifyConnectClientManager: ClientManager | undefined;

    const runTestOnce = async () => {
      const { resultId, capability } = await runTest(client, parsedTest, {
        option: capabilityOption,
        name: flags.name,
        urlReplacements,
        autifyConnectAccessPoint,
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
          configDir,
          cacheDir,
          userAgent,
          verbose: flags["autify-connect-client-verbose"],
          fileLogging: flags["autify-connect-client-file-logging"],
          debugServerPort: flags["autify-connect-client-debug-server-port"],
          webWorkspaceId: workspaceId,
          extraArguments: flags["autify-connect-client-extra-arguments"],
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
