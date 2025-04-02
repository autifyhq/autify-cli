import { jest, test } from "@jest/globals";
import execa from "execa";

import { delay } from "./delay";
import { getAutifyCliPath } from "./get-autify-cli-path";
import { interactWithProcess } from "./interact-with-process";
import { terminateStartProcess } from "./terminate-start-process";
import { pickupOneSimulator } from "./pickup-one-simulator";

const BUILD_ID = "rQuzJw";
const WORKSPACE_ID = "2WxFvm";
const TEAM_ID = "7XV69VPSD3";
const TEST_PLAN_URL =
  "https://mobile-app.autify.com/projects/2WxFvm/test_plans/kYtaqp";

jest.setTimeout(20 * 60 * 1000);

test("NoCode Mobile local device test execution flow", async () => {
  const { stdout: autifyCliVersion } = await execa("autify", ["--version"]);
  console.log("AUTIFY CLI version:", autifyCliVersion);

  const simulator = await pickupOneSimulator();
  if (!simulator) {
    throw new Error("No available iPhone simulator found");
  }

  console.log(`Simulator: ${simulator.name}(${simulator.udid})`);

  // Install mobilelink first to run the `config clean` command
  await interactWithProcess(
    getAutifyCliPath(),
    ["mobile", "link", "install"],
    [
      {
        type: "expect",
        regex: /Successfully installed Mobile Link/,
      },
    ]
  );

  const { stdout: mobileLinkVersion } = await execa("autify", [
    "mobile",
    "link",
    "exec",
    "--version",
  ]);
  console.log("MobileLink version:", mobileLinkVersion);

  await interactWithProcess(
    getAutifyCliPath(),
    ["mobile", "link", "exec", "config", "clean"],
    [
      {
        type: "expect",
        regex: /The configuration has been cleaned/,
      },
    ]
  );

  await interactWithProcess(
    getAutifyCliPath(),
    ["mobile", "auth", "login"],
    [
      {
        type: "question",
        regex: /Enter Access Token/,
        answer: `${process.env.AUTIFY_CLI_E2E_AUTIFY_MOBILE_ACCESS_TOKEN}\n`,
      },
    ]
  );

  await interactWithProcess(
    getAutifyCliPath(),
    ["mobile", "link", "setup"],
    [
      {
        type: "question",
        regex:
          /Enter the workspace ID of Nocode Mobile to use by default.*\n>/s,
        answer: `${WORKSPACE_ID}\n`,
      },
      {
        type: "question",
        regex: /Would you like to send information about test execution.*\n>/s,
        answer: "Yes\n",
      },
      {
        type: "question",
        regex: /Enter the Team ID of the Apple Developer Program.*\n>/s,
        answer: `${TEAM_ID}\n`,
      },
      {
        type: "question",
        regex: /Enter the Signing ID of the Apple Developer Program.*\n>/s,
        answer: "\n",
      },
      {
        type: "question",
        regex:
          /Enter the Bundle ID of WebDriverAgent to use for testing iOS apps.*\n>/s,
        answer: "com.autify.WebDriverAgentRunner\n",
      },
    ]
  );

  const startMobileLinkResult = interactWithProcess(
    getAutifyCliPath(),
    ["mobile", "link", "start"],
    [
      {
        type: "expect",
        regex: /Exiting this command with the same exit code\(0\)/,
      },
    ],
    {
      VERBOSE: "true",
    }
  );

  const runTest = async () => {
    await delay(10_000);

    await interactWithProcess(
      getAutifyCliPath(),
      [
        "mobile",
        "test",
        "run",
        "--build-id",
        BUILD_ID,
        "--wait",
        "--timeout",
        "1200",
        "--device-ids",
        simulator.udid,
        TEST_PLAN_URL,
      ],
      [
        {
          type: "expect",
          regex: /Test passed!/,
        },
      ]
    );

    terminateStartProcess();
  };

  await Promise.all([startMobileLinkResult, runTest()]);
});
