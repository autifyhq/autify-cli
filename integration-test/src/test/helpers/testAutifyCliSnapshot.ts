/* eslint-disable unicorn/filename-case */
import { execAutifyCli } from "../helpers/execAutifyCli";

export const iosBuildPath = "ios.app";
export const androidBuildPath = "android.apk";

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
