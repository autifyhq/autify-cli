/* eslint-disable unicorn/filename-case */
import { Errors } from "@oclif/core";

export const parseTestResultUrl = (
  url: string
): { workspaceId: number; resultId: number } => {
  const { pathname } = new URL(url);
  const testResultUrlPathRegExp =
    /\/projects\/(?<workspaceId>\d+)\/results\/(?<resultId>\d+)/;
  const match = testResultUrlPathRegExp.exec(pathname);
  const workspaceId = Number.parseInt(match?.groups?.workspaceId ?? "", 10);
  const resultId = Number.parseInt(match?.groups?.resultId ?? "", 10);
  if (!workspaceId || !resultId)
    throw new Errors.CLIError(`Invalid URL: ${url}`);
  return { workspaceId, resultId };
};
