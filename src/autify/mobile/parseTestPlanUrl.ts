/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";

export const parseTestPlanUrl = (
  url: string
): {
  workspaceId: string;
  testPlanId: string;
} => {
  const { pathname } = new URL(url);
  const testPlanUrlPathRegExp =
    /\/projects\/(?<workspaceId>[^/]+)\/test_plans\/(?<testPlanId>[^/]+)/;
  const match = testPlanUrlPathRegExp.exec(pathname);
  const workspaceId = match?.groups?.workspaceId;
  const testPlanId = match?.groups?.testPlanId;
  if (!workspaceId || !testPlanId) throw new CLIError(`Invalid URL: ${url}`);
  return { workspaceId, testPlanId };
};
