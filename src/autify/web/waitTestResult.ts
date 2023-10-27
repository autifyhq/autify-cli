/* eslint-disable unicorn/filename-case */
import { WebClient } from "@autifyhq/autify-sdk";
import { CLIError } from "@oclif/errors";
import Listr, { ListrTaskWrapper } from "listr";
import { setInterval } from "node:timers/promises";
import { get } from "node-emoji";

const waitUntil = async <T>(
  callback: (task: ListrTaskWrapper<{ result: T }>) => Promise<T>,
  timeoutSecond: number,
  intervalSecond: number,
  verbose: boolean
): Promise<T | void> => {
  const task = new Listr<{ result: T }>(
    [
      {
        async task(ctx, task) {
          let killed;
          process.on("SIGINT", (signal) => {
            killed = signal;
          });
          process.on("SIGTERM", (signal) => {
            killed = signal;
          });
          for await (const startTime of setInterval(
            intervalSecond * 1000,
            Date.now()
          )) {
            if (killed) throw new CLIError(`Process was killed by ${killed}.`);

            const now = Date.now();
            if (now - startTime > timeoutSecond * 1000) {
              throw new CLIError(`Timeout after ${timeoutSecond} seconds.`);
            }

            const result = await callback(task);
            if (result) {
              ctx.result = result;
              return;
            }
          }
        },
        title: `Waiting... (timeout: ${timeoutSecond} s)`,
      },
    ],
    {
      nonTTYRenderer: "verbose",
      renderer: verbose ? "verbose" : "default",
    }
  );
  const res = await task.run();
  return res.result;
};

type Status = Awaited<
  ReturnType<WebClient["describeResult"]>
>["data"]["status"];

const emojiStatus = (status?: Status) => {
  if (status === "queuing") return get("cyclone") + " Queuing";
  if (status === "waiting") return get("hourglass_flowing_sand") + " Waiting";
  if (status === "running") return get("car") + " Running";
  if (status === "passed") return get("+1") + " Passed ";
  if (status === "failed") return get("rotating_light") + " Failed ";
  if (status === "skipped") return get("zzz") + " Skipped";
  return get("grey_question") + " None   ";
};

const describeResult =
  (client: WebClient, workspaceId: number, resultId: number) =>
  async (task: ListrTaskWrapper) => {
    const { data } = await client.describeResult(workspaceId, resultId);
    const testPlanStatus = emojiStatus(data.status);
    const testCaseStatus: string[] = [];
    for (const testPlanCapabilityResult of data.test_plan_capability_results ??
      []) {
      for (const testCaseResult of testPlanCapabilityResult.test_case_results ??
        []) {
        testCaseStatus.push(emojiStatus(testCaseResult.status));
      }
    }

    task.output = `TestPlan: ${testPlanStatus}, TestCases: ${testCaseStatus.join(
      " / "
    )}`;
    if (data.finished_at) return data;
  };

/* eslint-disable @typescript-eslint/no-explicit-any */
export const waitTestResult = async (
  client: WebClient,
  workspaceId: number,
  resultId: number,
  options: { intervalSecond: number; timeoutSecond: number; verbose: boolean }
): Promise<{ data: any; isPassed: boolean }> => {
  const data = await waitUntil(
    describeResult(client, workspaceId, resultId),
    options.timeoutSecond,
    options.intervalSecond,
    options.verbose
  );
  const isPassed = data?.status === "passed";
  return {
    data,
    isPassed,
  };
};
