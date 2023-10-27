/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";

const parseTestScenarioUrl = (url: string) => {
  const { pathname } = new URL(url);
  const scenarioUrlPathRegExp =
    /\/projects\/(?<workspaceId>\d+)\/scenarios\/(?<scenarioId>\d+)/;
  const match = scenarioUrlPathRegExp.exec(pathname);
  const workspaceId = Number.parseInt(match?.groups?.workspaceId ?? "", 10);
  const testScenarioId = Number.parseInt(match?.groups?.scenarioId ?? "", 10);
  if (!workspaceId || !testScenarioId) return;
  return { testScenarioId, workspaceId };
};

const parseTestPlanUrl = (url: string) => {
  const { pathname } = new URL(url);
  const testPlanUrlPathRegExp =
    /\/projects\/(?<workspaceId>\d+)\/test_plans\/(?<testPlanId>\d+)/;
  const match = testPlanUrlPathRegExp.exec(pathname);
  const workspaceId = Number.parseInt(match?.groups?.workspaceId ?? "", 10);
  const testPlanId = Number.parseInt(match?.groups?.testPlanId ?? "", 10);
  if (!workspaceId || !testPlanId) return;
  return { testPlanId, workspaceId };
};

export type TestScenario = Readonly<{
  testPlanId?: never;
  testScenarioId: number;
  workspaceId: number;
}>;

export type TestPlan = Readonly<{
  testPlanId: number;
  testScenarioId?: never;
  workspaceId: number;
}>;

export const parseAutifyTestUrl = (url: string): TestPlan | TestScenario => {
  const testScenario = parseTestScenarioUrl(url);
  const testPlan = parseTestPlanUrl(url);
  if (testScenario) return testScenario;
  if (testPlan) return testPlan;
  throw new CLIError(`Invalid URL: ${url}`);
};
