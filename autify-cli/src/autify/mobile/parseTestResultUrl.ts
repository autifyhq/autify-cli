/* eslint-disable unicorn/filename-case */
import { Errors } from "@oclif/core";

export const parseTestResultUrl = (
  url: string
): { workspaceId: string; resultId: string } => {
  const { pathname } = new URL(url);
  const testResultUrlPathRegExp =
    /\/projects\/(?<workspaceId>[^/]+)\/results\/(?<resultId>[^/]+)/;
  const match = testResultUrlPathRegExp.exec(pathname);
  const workspaceId = match?.groups?.workspaceId;
  const resultId = match?.groups?.resultId;
  if (!workspaceId || !resultId)
    throw new Errors.CLIError(`Invalid URL: ${url}`);
  return { workspaceId, resultId };
};
