/* eslint-disable unicorn/filename-case */
import { Errors } from "@oclif/core";
import { arch, env, platform } from "node:process";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { basename, dirname, join } from "node:path";
import { Extract } from "unzip-stream";
import { execFile } from "node:child_process";
import * as tar from "tar";
import { get } from "../../../config";

const MOBILE_LINK_VERSION = "0.6.0";
const MOBILE_LINK_HASH = "1eae4c5a9";

const getArch = () => {
  if (arch === "ia32") return "386";
  if (arch === "x64") return "x64";
  if (arch === "arm64") return "arm64";
  throw new Errors.CLIError(`Unsupported Architecture: ${arch}`);
};

const getFileName = () =>
  platform === "win32" ? "mobilelink.cmd" : "mobilelink";

export const getMobileLinkSourceUrl = (configDir: string): URL => {
  const customUrl = get(configDir, "AUTIFY_MOBILE_LINK_SOURCE_URL");
  if (customUrl) {
    return new URL(customUrl);
  }

  const baseUrl = "https://d21jojv86oc6d1.cloudfront.net/mobilelink/versions";
  const prefix = "mobilelink";
  const arch = getArch();
  return new URL(
    `${baseUrl}/${MOBILE_LINK_VERSION}/${MOBILE_LINK_HASH}/${prefix}-v${MOBILE_LINK_VERSION}-${MOBILE_LINK_HASH}-${platform}-${arch}.tar.gz`
  );
};

const download = async (workspaceDir: string, url: URL) => {
  const downloadPath = join(workspaceDir, basename(url.pathname));
  const response = await fetch(url);
  if (!response.ok) {
    const b = await response.text();
    console.log("response doby!!!", b);
    throw new Errors.CLIError(`Failed to fetch ${url}: ${response.status}`);
  }

  const streamPipeline = promisify(pipeline);
  if (response.body) {
    await streamPipeline(response.body, createWriteStream(downloadPath));
  }

  return downloadPath;
};

const extract = async (downloadPath: string) => {
  const dir = dirname(downloadPath);
  if (downloadPath.endsWith(".tar.gz")) {
    const streamPipeline = promisify(pipeline);
    await streamPipeline(createReadStream(downloadPath), tar.x({ cwd: dir }));
  } else if (downloadPath.endsWith(".zip")) {
    const streamPipeline = promisify(pipeline);
    await streamPipeline(
      createReadStream(downloadPath),
      // eslint-disable-next-line new-cap
      Extract({ path: dir })
    );
  } else {
    throw new Errors.CLIError(`Unsupported file format: ${downloadPath}`);
  }

  const binDir = join(dir, "mobilelink", "bin");
  const files = readdirSync(binDir);

  const binary = files.find((file) => file.startsWith(getFileName()));
  if (!binary)
    throw new Errors.CLIError(`Cannot find any mobilelink binary in ${binDir}`);
  return join(dir, "mobilelink");
};

const getWorkspaceDir = (cacheDir: string) =>
  join(cacheDir, "mobilelink-install-workspace");

export const getInstallPath = (cacheDir: string): string => {
  const directoryName = "mobilelink";
  return join(cacheDir, directoryName);
};

export const getBinaryPath = (cacheDir: string): string => {
  return join(getInstallPath(cacheDir), "bin", getFileName());
};

export const getInstallVersion = async (path: string): Promise<string> => {
  if (!existsSync(path)) {
    throw new Errors.CLIError(
      `MobileLink isn't installed yet at ${path}. Run \`autify mobile link install\` first.`
    );
  }

  const { stdout } = await promisify(execFile)(path, ["--version"], {
    env,
    // On Windows, we need to specify shell:true to handle permission issues
    shell: platform === "win32",
  });
  const version = stdout.trim();
  if (version === "") throw new Errors.CLIError("Version is empty");
  return version;
};

export const installBinary = async (
  cacheDir: string,
  url: URL
): Promise<{ version: string; path: string }> => {
  const workspaceDir = getWorkspaceDir(cacheDir);
  // Clean up workspace in case something is left by previous command.
  if (existsSync(workspaceDir))
    rmSync(workspaceDir, { recursive: true, force: true });
  mkdirSync(workspaceDir, { recursive: true });
  const downloadPath = await download(workspaceDir, url);
  const extractPath = await extract(downloadPath);
  const installPath = getInstallPath(cacheDir);
  rmSync(installPath, { recursive: true, force: true });
  renameSync(extractPath, installPath);
  const binaryPath = getBinaryPath(cacheDir);
  const versionString = await getInstallVersion(binaryPath);
  // Clean up workspace. Ignore any exception as install is already done.
  try {
    rmSync(workspaceDir, { recursive: true, force: true });
  } catch (error) {
    console.error(
      `Workspace clean up failed. Ignoring because already installed. (error: ${error})`
    );
  }

  return {
    version: versionString,
    path: installPath,
  };
};
