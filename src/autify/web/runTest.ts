/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";
import { WebClient } from "@autifyhq/autify-sdk";

type CapabilityOption = Parameters<
  WebClient["executeScenarios"]
>[1]["capabilities"][number];
type CreateUrlReplacementRequest = Parameters<
  WebClient["createUrlReplacement"]
>[1];

const parseScenarioUrl = (url: string) => {
  const { pathname } = new URL(url);
  const scenarioUrlPathRegExp =
    /\/projects\/(?<workspaceId>\d+)\/scenarios\/(?<scenarioId>\d+)/;
  const match = scenarioUrlPathRegExp.exec(pathname);
  const workspaceId = Number.parseInt(match?.groups?.workspaceId ?? "", 10);
  const scenarioId = Number.parseInt(match?.groups?.scenarioId ?? "", 10);
  if (!workspaceId || !scenarioId) return;
  return { workspaceId, scenarioId };
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

const isCapabilitySpecified = (option: CapabilityOption) => {
  return Object.values(option).some(Boolean);
};

const getCapability = async (
  client: WebClient,
  workspaceId: number,
  option: CapabilityOption
) => {
  if (!isCapabilitySpecified(option)) {
    option.os = "Linux";
    option.browser = "Chrome";
  }

  const capabilities = await client.listCapabilities(workspaceId);
  const candidates = capabilities.data
    .filter((c) => !option.os || c.os === option.os)
    .filter((c) => !option.os_version || c.os_version === option.os_version)
    .filter(
      (c) =>
        option.device_type || !option.browser || c.browser === option.browser
    )
    .filter((c) => !option.device || c.device === option.device)
    .filter((c) => !option.device_type || c.device_type === option.device_type);
  if (candidates.length === 0)
    throw new CLIError(
      `No capability is available for: ${JSON.stringify(option)}`
    );
  if (candidates.length > 1)
    throw new CLIError(
      `Multiple capabilities are available for: ${JSON.stringify(
        option
      )} => ${JSON.stringify(candidates)}`
    );
  return candidates[0];
};

/* eslint-disable camelcase */
const capabilityToString = ({
  os,
  os_version,
  browser,
  browser_version,
  device,
  device_type,
}: CapabilityOption) => {
  return [os, os_version, browser, browser_version, device, device_type]
    .filter((s) => Boolean(s))
    .join(" ");
};
/* eslint-enable camelcase */

type RunTestProps = Readonly<{
  option: CapabilityOption;
  name?: string;
  urlReplacements: CreateUrlReplacementRequest[];
}>;

export const runTest = async (
  client: WebClient,
  url: string,
  { option, name, urlReplacements }: RunTestProps
): Promise<{ workspaceId: number; resultId: number; capability: string }> => {
  const scenario = parseScenarioUrl(url);
  const testPlan = parseTestPlanUrl(url);
  if (scenario) {
    const { workspaceId, scenarioId } = scenario;
    const capability = await getCapability(client, workspaceId, option);
    const res = await client.executeScenarios(workspaceId, {
      name,
      capabilities: [capability],
      scenarios: [{ id: scenarioId }],
      // eslint-disable-next-line camelcase
      url_replacements: urlReplacements,
    });
    return {
      workspaceId,
      resultId: res.data.result_id,
      capability: capabilityToString(capability),
    };
  }

  if (testPlan) {
    if (isCapabilitySpecified(option))
      throw new CLIError(
        `Running TestPlan doesn't support capability override: ${JSON.stringify(
          option
        )}`
      );
    if (name)
      throw new CLIError(`Running TestPlan doesn't support --name: ${name}`);
    const { workspaceId, testPlanId } = testPlan;
    const urlReplacementIds = [];
    for await (const urlReplacement of urlReplacements ?? []) {
      const res = await client.createUrlReplacement(testPlanId, urlReplacement);
      urlReplacementIds.push(res.data.id);
    }

    const res = await client.executeSchedule(testPlanId);
    for await (const urlReplacementId of urlReplacementIds) {
      await client.deleteUrlReplacement(testPlanId, urlReplacementId);
    }

    return {
      workspaceId,
      resultId: res.data.data.id,
      capability: "configured by test plan",
    };
  }

  throw new CLIError(`Invalid URL: ${url}`);
};
