/* eslint-disable unicorn/filename-case */
import { Errors } from "@oclif/core";

const parseTestScenarioUrl = (url: string) => {
  const { pathname } = new URL(url);
  const scenarioUrlPathRegExp =
    /\/projects\/(?<workspaceId>\d+)\/scenarios\/(?<scenarioId>\d+)/;
  const match = scenarioUrlPathRegExp.exec(pathname);
  const workspaceId = Number.parseInt(match?.groups?.workspaceId ?? "", 10);
  const testScenarioId = Number.parseInt(match?.groups?.scenarioId ?? "", 10);
  if (!workspaceId || !testScenarioId) return;
  return { workspaceId, testScenarioId };
};

const parseTestPlanUrl = (url: string) => {
  const { pathname } = new URL(url);
  const testPlanUrlPathRegExp =
    /\/projects\/(?<workspaceId>\d+)\/test_plans\/(?<testPlanId>\d+)/;
  const match = testPlanUrlPathRegExp.exec(pathname);
  const workspaceId = Number.parseInt(match?.groups?.workspaceId ?? "", 10);
  const testPlanId = Number.parseInt(match?.groups?.testPlanId ?? "", 10);
  if (!workspaceId || !testPlanId) return;
  return { workspaceId, testPlanId };
};

export type TestScenario = Readonly<{
  workspaceId: number;
  testScenarioId: number;
  testPlanId?: never;
}>;

export type TestPlan = Readonly<{
  workspaceId: number;
  testScenarioId?: never;
  testPlanId: number;
}>;

export const parseAutifyTestUrl = (url: string): TestScenario | TestPlan => {
  const testScenario = parseTestScenarioUrl(url);
  const testPlan = parseTestPlanUrl(url);
  if (testScenario) return testScenario;
  if (testPlan) return testPlan;
  throw new Errors.CLIError(`Invalid URL: ${url}`);
};
