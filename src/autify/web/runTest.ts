/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";
import { WebClient } from "@autifyhq/autify-sdk";
import { TestPlan, TestScenario } from "./parseAutifyTestUrl";

type CapabilityOption = Parameters<
  WebClient["executeScenarios"]
>[1]["capabilities"][number];
type CreateUrlReplacementRequest = Parameters<
  WebClient["createUrlReplacement"]
>[1];

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
  autifyConnectAccessPoint?: string;
}>;

export const runTest = async (
  client: WebClient,
  parsedTest: TestScenario | TestPlan,
  { option, name, urlReplacements, autifyConnectAccessPoint }: RunTestProps
): Promise<{ resultId: number; capability: string }> => {
  const { workspaceId, testScenarioId, testPlanId } = parsedTest;
  if (testScenarioId) {
    const capability = await getCapability(client, workspaceId, option);
    const res = await client.executeScenarios(workspaceId, {
      name,
      capabilities: [capability],
      scenarios: [{ id: testScenarioId }],
      // eslint-disable-next-line camelcase
      url_replacements: urlReplacements,
      ...(autifyConnectAccessPoint && {
        // eslint-disable-next-line camelcase
        autify_connect: {
          name: autifyConnectAccessPoint,
        },
      }),
    });
    return {
      resultId: res.data.result_id,
      capability: capabilityToString(capability),
    };
  }

  if (testPlanId) {
    if (isCapabilitySpecified(option))
      throw new CLIError(
        `Running TestPlan doesn't support capability override: ${JSON.stringify(
          option
        )}`
      );
    if (name)
      throw new CLIError(`Running TestPlan doesn't support --name: ${name}`);
    if (autifyConnectAccessPoint)
      throw new CLIError(
        "Running TestPlan doesn't support Autify Connect Access Point"
      );
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
      resultId: res.data.data.id,
      capability: "configured by test plan",
    };
  }

  throw new CLIError("testScenarioId or testPlanId is required.");
};
