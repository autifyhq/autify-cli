/* eslint-disable unicorn/filename-case */
import { MobileClient } from "@autifyhq/autify-sdk";
import { CLIError } from "@oclif/errors";
import { lstatSync } from "node:fs";
import { createZip } from "./createZip";

const parseTestPlanUrl = (url: string) => {
  const { pathname } = new URL(url);
  const testPlanUrlPathRegExp =
    /\/projects\/(?<workspaceId>[^/]+)\/test_plans\/(?<testPlanId>[^/]+)/;
  const match = testPlanUrlPathRegExp.exec(pathname);
  const workspaceId = match?.groups?.workspaceId;
  const testPlanId = match?.groups?.testPlanId;
  if (!workspaceId || !testPlanId) return;
  return { workspaceId, testPlanId };
};

const isIosApp = (buildPath: string) => {
  return (
    lstatSync(buildPath).isDirectory() &&
    buildPath.replace(/\/$/, "").endsWith(".app")
  );
};

const isAndroidApp = (buildPath: string) => {
  return lstatSync(buildPath).isFile() && buildPath.endsWith(".apk");
};

const uploadBuild = async (
  client: MobileClient,
  projectId: string,
  buildPath: string
) => {
  if (isIosApp(buildPath)) {
    const zipFile = await createZip(buildPath);
    const res = await client.uploadBuild(projectId, zipFile);
    return res.data.id;
  }

  if (isAndroidApp(buildPath)) {
    const res = await client.uploadBuild(projectId, buildPath);
    return res.data.id;
  }

  throw new CLIError(`${buildPath} doesn't look like iOS app nor Android apk.`);
};

export const runTest = async (
  client: MobileClient,
  url: string,
  buildPath: string
): Promise<{ workspaceId: string; resultId: string }> => {
  const testPlan = parseTestPlanUrl(url);
  if (testPlan) {
    const { workspaceId, testPlanId } = testPlan;
    const buildId = await uploadBuild(client, workspaceId, buildPath);
    const res = await client.runTestPlan(testPlanId, {
      // eslint-disable-next-line camelcase
      build_id: buildId,
    });
    const resultId = res.data.id ?? "";
    return { workspaceId, resultId };
  }

  throw new CLIError(`Invalid URL: ${url}`);
};
