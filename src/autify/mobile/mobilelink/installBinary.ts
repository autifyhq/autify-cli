/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";
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

const getOs = () => {
  const os = platform;
  if (os === "linux") return "linux";
  if (os === "darwin") return "darwin";
  if (os === "win32") return "windows";
  throw new CLIError(`Unsupported OS: ${os}`);
};

const getArch = () => {
  if (arch === "ia32") return "386";
  if (arch === "x64") return "amd64";
  if (arch === "arm64") return "arm64";
  throw new CLIError(`Unsupported Architecture: ${arch}`);
};

const getExt = () => (getOs() === "windows" ? "zip" : "tar.gz");

export const getMobileLinkSourceUrl = (configDir: string): URL => {
  const customUrl = get(configDir, "AUTIFY_MOBILE_LINK_SOURCE_URL");
  if (customUrl) {
    return new URL(customUrl);
  }

  const baseUrl =
    "https://d21jojv86oc6d1.cloudfront.net/mobilelink/channels/stable";
  const prefix = "mobilelink";
  const os = getOs();
  const arch = getArch();
  const ext = getExt();
  return new URL(`${baseUrl}/${prefix}-${os}-${arch}.${ext}`);
};

const download = async (workspaceDir: string, url: URL) => {
  const downloadPath = join(workspaceDir, basename(url.pathname));
  const response = await fetch(url);
  if (!response.ok) {
    const b = await response.text();
    console.log("response doby!!!", b);
    throw new CLIError(`Failed to fetch ${url}: ${response.status}`);
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
    throw new CLIError(`Unsupported file format: ${downloadPath}`);
  }

  const binDir = join(dir, "mobilelink", "bin");
  const files = readdirSync(binDir);
  const binary = files.find((file) => file.startsWith("mobilelink"));
  if (!binary)
    throw new CLIError(`Cannot find any mobilelink binary in ${binDir}`);
  return join(dir, "mobilelink");
};

const getWorkspaceDir = (cacheDir: string) =>
  join(cacheDir, "mobilelink-install-workspace");

export const getInstallPath = (cacheDir: string): string => {
  const directoryName = "mobilelink";
  return join(cacheDir, directoryName);
};

export const getInstallVersion = async (path: string): Promise<string> => {
  const binaryPath = join(path, "bin", "mobilelink");
  if (!existsSync(binaryPath)) {
    throw new CLIError(
      `Autify Mobile Link isn't installed yet at ${binaryPath}. Run \`autify mobile link install\` first.`
    );
  }

  const { stdout } = await promisify(execFile)(binaryPath, ["--version"], {
    env,
  });
  const version = stdout.trim();
  if (version === "") throw new CLIError("Version is empty");
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
  const versionString = await getInstallVersion(installPath);
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
