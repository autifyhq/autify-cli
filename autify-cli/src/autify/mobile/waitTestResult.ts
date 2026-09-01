/* eslint-disable unicorn/filename-case */
import { Errors } from "@oclif/core";
import Listr, { ListrTaskWrapper } from "listr";
import { setInterval } from "node:timers/promises";
import { MobileClient } from "@autifyhq/autify-sdk";
import * as emoji from "node-emoji";

const waitUntil = async <T>(
  callback: (task: ListrTaskWrapper<{ result: T }>) => Promise<T>,
  timeoutSecond: number,
  intervalSecond: number,
  verbose: boolean
): Promise<T | void> => {
  const task = new Listr<{ result: T }>(
    [
      {
        title: `Waiting... (timeout: ${timeoutSecond} s)`,
        task: async (ctx, task) => {
          for await (const startTime of setInterval(
            intervalSecond * 1000,
            Date.now()
          )) {
            const now = Date.now();
            if (now - startTime > timeoutSecond * 1000) {
              throw new Errors.CLIError(
                `Timeout after ${timeoutSecond} seconds.`
              );
            }

            const result = await callback(task);
            if (result) {
              ctx.result = result;
              return;
            }
          }
        },
      },
    ],
    {
      renderer: verbose ? "verbose" : "default",
      nonTTYRenderer: "verbose",
    }
  );
  const res = await task.run();
  return res.result;
};

type Status = Awaited<
  ReturnType<MobileClient["describeTestResult"]>
>["data"]["status"];

type StatusDisplay = { emoji: string[]; label: string };

/* eslint-disable camelcase */
const STATUS_DISPLAY: Record<string, StatusDisplay> = {
  canceled: { emoji: ["stop_button"], label: "Canceled" },
  failed: { emoji: ["x"], label: "Failed" },
  internal_error: { emoji: ["no_entry_sign"], label: "Internal error" },
  passed: { emoji: ["+1"], label: "Passed" },
  queuing: { emoji: ["vertical_traffic_light"], label: "Queuing" },
  running: { emoji: ["red_car"], label: "Running" },
  skip_passed: {
    emoji: ["white_check_mark", "fast_forward"],
    label: "Already passed",
  },
  skipped: { emoji: ["fast_forward"], label: "Skipped" },
  wait_device: { emoji: ["hourglass"], label: "Waiting device" },
  wait_device_timeout: { emoji: ["stopwatch"], label: "Device timeout" },
  waiting: { emoji: ["hourglass_flowing_sand"], label: "Waiting" },
};
/* eslint-enable camelcase */

const UNKNOWN_STATUS: StatusDisplay = {
  emoji: ["grey_question"],
  label: "None",
};

const MIN_LABEL_WIDTH = 7;

const emojiStatus = (status?: Status) => {
  const { emoji: names, label } =
    STATUS_DISPLAY[status ?? ""] ?? UNKNOWN_STATUS;
  const glyphs = names.map((name) => emoji.get(name)).join("");
  return `${glyphs} ${label.padEnd(MIN_LABEL_WIDTH)}`;
};

const describeTestResult =
  (client: MobileClient, workspaceId: string, resultId: string) =>
  async (task: ListrTaskWrapper) => {
    const { data } = await client.describeTestResult(workspaceId, resultId);
    const testPlanStatus = emojiStatus(data.status);
    const testCaseStatus: string[] = [];
    for (const testCaseResult of data.test_case_results ?? []) {
      testCaseStatus.push(emojiStatus(testCaseResult.status));
    }

    task.output = `TestPlan: ${testPlanStatus}, TestCases: ${testCaseStatus.join(
      " / "
    )}`;
    if (data.finished_at) return data;
  };

export const waitTestResult = async (
  client: MobileClient,
  workspaceId: string,
  resultId: string,
  options: { timeoutSecond: number; verbose: boolean; intervalSecond: number }
): Promise<{ isPassed: boolean; data: any }> => {
  const data = await waitUntil(
    describeTestResult(client, workspaceId, resultId),
    options.timeoutSecond,
    options.intervalSecond,
    options.verbose
  );
  const isPassed = data?.status === "passed";
  return {
    isPassed,
    data,
  };
};
