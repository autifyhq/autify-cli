/* eslint-disable unicorn/filename-case */

import { CLIError } from "@oclif/errors";
import { execFileSync } from "node:child_process";
import { lstatSync } from "node:fs";
import { platform } from "node:os";
import { basename, dirname, resolve } from "node:path";
import which from "which";
import { dynamicImport } from "tsimportlib";

const checkPlatform = () => {
  const supportedPlatforms: NodeJS.Platform[] = ["linux", "darwin"];
  const p = platform();
  if (!supportedPlatforms.includes(p)) {
    throw new CLIError(
      `${p} is not supported to zip file. Only supports: ${supportedPlatforms}`
    );
  }
};

const checkBuildPath = (buildPath: string) => {
  if (!lstatSync(buildPath).isDirectory()) {
    throw new CLIError(`Build path (${buildPath}) is expected to directory.`);
  }

  const parentPath = resolve(dirname(buildPath));
  const name = basename(buildPath);
  return [parentPath, name];
};

const findZip = () => {
  const zip = which.sync("zip", { nothrow: true });
  if (!zip) {
    throw new CLIError("Can't find zip command in PATH.");
  }

  return zip;
};

export const createZip = async (buildPath: string): Promise<string> => {
  checkPlatform();
  const [parentPath, name] = checkBuildPath(buildPath);
  const zip = findZip();
  const { temporaryFile } = (await dynamicImport(
    "tempy",
    // eslint-disable-next-line unicorn/prefer-module
    module
  )) as typeof import("tempy");
  const zipFile = temporaryFile({ name: "build.zip" });
  execFileSync(zip, ["-r", zipFile, name], { cwd: parentPath });
  return zipFile;
};
