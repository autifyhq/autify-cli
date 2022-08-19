/* eslint-disable unicorn/filename-case */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execAutifyCli } from "../helpers/execAutifyCli";

const iosBuildPath = "ios.app";
const androidBuildPath = "android.apk";
// https://commons.wikimedia.org/wiki/File:Transparent.gif
const tinyBinary = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);
// Generate fake build files if not exiting.
// For recording, you should setup the real files on the same paths.
if (!existsSync(iosBuildPath)) {
  mkdirSync(iosBuildPath); // *.app is a directory
  writeFileSync(join(iosBuildPath, "ios"), tinyBinary); // Add a fake binary file
}

if (!existsSync(androidBuildPath)) {
  writeFileSync(androidBuildPath, tinyBinary); // Create a fake binary file
}

export const webTestRun =
  "web test run https://app.autify.com/projects/743/scenarios/91437";
export const webTestRunWait =
  "web test run https://app.autify.com/projects/743/scenarios/91437 --wait";
export const mobileBuildUpload = `mobile build upload --workspace-id nYmF1n ${androidBuildPath}`;
export const mobileTestRun =
  "mobile test run --build-id 8DuzpG https://mobile-app.autify.com/projects/nYmF1n/test_plans/DEWt9g";
export const mobileTestRunWait =
  "mobile test run --build-id 8DuzpG https://mobile-app.autify.com/projects/nYmF1n/test_plans/DEWt9g --wait";
export const mobileTestRunAndroid = `mobile test run --build-path ${androidBuildPath} https://mobile-app.autify.com/projects/nYmF1n/test_plans/DEWt9g`;
export const mobileTestRunIos = `mobile test run --build-path ${iosBuildPath} https://mobile-app.autify.com/projects/nYmF1n/test_plans/DPjteo`;

export const testAutifyCliSnapshot = (command: string): void => {
  test(`autify ${command}`, async () => {
    expect(await execAutifyCli(command)).toMatchSnapshot();
  }, 300_000);
};
