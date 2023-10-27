/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";

export const parseTestResultUrl = (
  url: string
): { resultId: string; workspaceId: string } => {
  const { pathname } = new URL(url);
  const testResultUrlPathRegExp =
    /\/projects\/(?<workspaceId>[^/]+)\/results\/(?<resultId>[^/]+)/;
  const match = testResultUrlPathRegExp.exec(pathname);
  const workspaceId = match?.groups?.workspaceId;
  const resultId = match?.groups?.resultId;
  if (!workspaceId || !resultId) throw new CLIError(`Invalid URL: ${url}`);
  return { resultId, workspaceId };
};
