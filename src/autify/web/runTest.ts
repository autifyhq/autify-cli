/* eslint-disable unicorn/filename-case */
import { WebClient } from "@autifyhq/autify-sdk";
import { CLIError } from "@oclif/errors";

import { TestPlan, TestScenario } from "./parseAutifyTestUrl";

type CapabilityOption = Parameters<
  WebClient["executeScenarios"]
>[1]["capabilities"][number];
type CreateUrlReplacementRequest = Parameters<
  WebClient["createUrlReplacement"]
>[1];

const isCapabilitySpecified = (option: CapabilityOption) =>
  Object.values(option).some(Boolean);

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
  browser,
  browser_version,
  device,
  device_type,
  os,
  os_version,
}: CapabilityOption) =>
  [os, os_version, browser, browser_version, device, device_type]
    .filter(Boolean)
    .join(" ");
/* eslint-enable camelcase */

type RunTestProps = Readonly<{
  autifyConnectAccessPoint?: string;
  name?: string;
  option: CapabilityOption;
  urlReplacements: CreateUrlReplacementRequest[];
}>;

export const runTest = async (
  client: WebClient,
  parsedTest: TestPlan | TestScenario,
  { autifyConnectAccessPoint, name, option, urlReplacements }: RunTestProps
): Promise<{ capability: string; resultId: number }> => {
  const { testPlanId, testScenarioId, workspaceId } = parsedTest;
  if (testScenarioId) {
    const capability = await getCapability(client, workspaceId, option);
    const res = await client.executeScenarios(workspaceId, {
      capabilities: [capability],
      name,
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
      capability: capabilityToString(capability),
      resultId: res.data.result_id,
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
    const urlReplacementIds = [];
    for await (const urlReplacement of urlReplacements ?? []) {
      const res = await client.createUrlReplacement(testPlanId, urlReplacement);
      urlReplacementIds.push(res.data.id);
    }

    const res = await client.executeSchedule(testPlanId, {
      ...(autifyConnectAccessPoint && {
        // eslint-disable-next-line camelcase
        autify_connect: {
          name: autifyConnectAccessPoint,
        },
      }),
    });
    for await (const urlReplacementId of urlReplacementIds) {
      await client.deleteUrlReplacement(testPlanId, urlReplacementId);
    }

    return {
      capability: "configured by test plan",
      resultId: res.data.data.id,
    };
  }

  throw new CLIError("testScenarioId or testPlanId is required.");
};
