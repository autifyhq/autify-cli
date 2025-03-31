import * as fs from "node:fs";
import * as fsPromises from "node:fs/promises";
import * as https from "node:https";
import { spawn } from "node:child_process";
import path from "node:path";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { env } from "node:process";
import * as tar from "tar";
import { tmpdir } from "node:os";
import { execa } from "execa";

const AUTIFY_CLI_URL =
  "https://autify-cli-assets.s3.us-west-2.amazonaws.com/autify-cli/channels/beta/autify-darwin-arm64.tar.gz";
const BUILD_ID = "rQuzJw";
const WORKSPACE_ID = "2WxFvm";
const TEAM_ID = "7XV69VPSD3";
const TEST_PLAN_URL =
  "https://mobile-app.autify.com/projects/2WxFvm/test_plans/kYtaqp";

type Simulator = {
  isAvailable: boolean;
  name: string;
  udid: string;
};

const flow = async () => {
  const workingDir = await createWorkingDir();
  console.log(`Working directory: ${workingDir}`);

  const binaryUrl = new URL(AUTIFY_CLI_URL);
  const archivePath = path.join(workingDir, path.basename(binaryUrl.pathname));

  await downloadBinary(AUTIFY_CLI_URL, archivePath);

  const binaryPath = await extract(workingDir, archivePath);
  console.log(`Extracted binary path: ${binaryPath}`);

  //   const binaryPath =
  //     "/var/folders/2t/ndb5vh014k1bw8jljyqgkgs80000gn/T/autify-cli-e2e-AM1ZY9/autify/bin/autify";

  const simulator = await pickupOneiPhoneSimulator();
  if (!simulator) {
    console.log("No available iPhone simulator found.");
    return;
  }

  console.log(`Simulator: ${simulator.name}(${simulator.udid})`);

  await interactWithProcess(
    binaryPath,
    ["mobile", "auth", "login"],
    [
      {
        query: /Enter Access Token/,
        answer: `${process.env.AUTIFY_CLI_E2E_AUTIFY_MOBILE_ACCESS_TOKEN}\n`,
      },
    ]
  );

  await interactWithProcess(
    binaryPath,
    ["mobile", "link", "setup"],
    [
      {
        query:
          /Enter the workspace ID of Nocode Mobile to use by default.*\n>/s,
        answer: `${WORKSPACE_ID}\n`,
      },
      {
        query: /Would you like to send information about test execution.*\n>/s,
        answer: "Yes\n",
      },
      {
        query: /Enter the Team ID of the Apple Developer Program.*\n>/s,
        answer: `${TEAM_ID}\n`,
      },
      {
        query: /Enter the Signing ID of the Apple Developer Program.*\n>/s,
        answer: "\n",
      },
      {
        query:
          /Enter the Bundle ID of WebDriverAgent to use for testing iOS apps.*\n>/s,
        answer: "com.autify.WebDriverAgentRunner\n",
      },
    ]
  );

  const startMobileLinkResult = interactWithProcess(
    binaryPath,
    ["mobile", "link", "start"],
    [
      {
        query: /Exiting this command with the same exit code\(0\)/,
      },
    ]
  );

  const runTest = async () => {
    await delay(5000);

    await interactWithProcess(
      binaryPath,
      [
        "mobile",
        "test",
        "run",
        "--build-id",
        BUILD_ID,
        "--wait",
        "--device-ids",
        simulator.udid,
        TEST_PLAN_URL,
      ],
      [
        {
          query: /Test passed!/,
        },
      ]
    );

    killStartProcess();
  };

  await Promise.all([startMobileLinkResult, runTest()]);
};

const extract = async (
  workingDir: string,
  downloadPath: string
): Promise<string> => {
  const streamPipeline = promisify(pipeline);
  await streamPipeline(
    fs.createReadStream(downloadPath),
    tar.x({ cwd: workingDir })
  );

  return path.join(workingDir, "autify", "bin", "autify");
};

const createWorkingDir = (): Promise<string> => {
  return fsPromises.mkdtemp(path.join(tmpdir(), "autify-cli-e2e-"));
};

const downloadBinary = (url: string, path: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close(() => {
            // Don't care of error on closing
            resolve();
          });
        });
      })
      .on("error", (err) => {
        fs.unlink(path, () => reject(err));
      });
  });
};

const interactWithProcess = async (
  binaryPath: string,
  argv: string[],
  interactions: {
    query: RegExp;
    answer?: string;
  }[]
): Promise<void> => {
  const child = spawn(binaryPath, argv, {
    env: {
      ...env,
      VERBOSE: "true",
    },
  });

  for await (const interaction of interactions) {
    const { query, answer } = interaction;
    let text = "";
    for await (const data of child.stdout.iterator({
      destroyOnReturn: false,
    })) {
      process.stdout.write(data);
      text += data.toString();
      if (query.test(text)) {
        if (answer) {
          child.stdin.write(answer);
        }

        break;
      }
    }
  }
};

const pickupOneiPhoneSimulator = async (): Promise<Simulator | null> => {
  const { stdout } = await execa`xcrun simctl list devices --json`;
  const devices = JSON.parse(stdout).devices;
  const simulators = (Object.values(devices).flat() as Simulator[]).filter(
    (device) => {
      return device.isAvailable && device.name.includes("iPhone");
    }
  );
  if (simulators.length === 0) {
    return null;
  }

  return simulators[0];
};

const killStartProcess = () => {
  spawn("pkill", ["-f", "run link start"]);
};

const delay = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

flow();
