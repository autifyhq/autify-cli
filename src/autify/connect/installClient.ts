/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";
import { arch, env, platform } from "node:process";
import fetch from "node-fetch";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { basename, dirname, join } from "node:path";
import { Extract } from "unzip-stream";
import { execFile } from "node:child_process";
import { get } from "../../config";

// Update whenever to bump supported version.
export const AUTIFY_CONNECT_CLIENT_SUPPORTED_VERSION = "v0.6.1";

export type ClientMode = "fake" | "real";

const getMode = (configDir: string): ClientMode => {
  const mode = get(configDir, "AUTIFY_CONNECT_CLIENT_MODE");
  if (!mode) return "real";
  if (!["fake", "real"].includes(mode))
    throw new CLIError(
      `Unknown value is specified by AUTIFY_CONNECT_CLIENT_MODE: ${mode}`
    );
  return mode as ClientMode;
};

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

const realBaseUrl =
  "https://autifyconnect.s3.ap-northeast-1.amazonaws.com/autifyconnect/versions";
const fakeBaseUrl =
  "https://autifyconnect.s3.ap-northeast-1.amazonaws.com/fake/versions";
const getUrl = (mode: ClientMode, version: string) => {
  const baseUrl = mode === "fake" ? fakeBaseUrl : realBaseUrl;
  const prefix = mode === "fake" ? "autifyconnect-fake" : "autifyconnect";
  const os = getOs();
  const arch = getArch();
  const ext = getExt();
  return new URL(`${baseUrl}/${version}/${prefix}_${os}_${arch}.${ext}`);
};

const download = async (
  workspaceDir: string,
  mode: ClientMode,
  version: string
) => {
  const url = getUrl(mode, version);
  const downloadPath = join(workspaceDir, basename(url.pathname));
  const response = await fetch(url);
  if (!response.ok)
    throw new CLIError(`Failed to fetch ${url}: ${response.status}`);
  const streamPipeline = promisify(pipeline);
  await streamPipeline(response.body, createWriteStream(downloadPath));
  return downloadPath;
};

const extract = async (downloadPath: string) => {
  const file = basename(downloadPath);
  const dir = dirname(downloadPath);
  const binaryName = file.startsWith("autifyconnect-fake")
    ? "autifyconnect-fake"
    : "autifyconnect";
  if (file.endsWith(".tar.gz")) {
    // TODO: Pure JS
    await promisify(execFile)("tar", ["xvzf", file], { cwd: dir });
    return join(dir, binaryName);
  }

  if (file.endsWith(".zip")) {
    const streamPipeline = promisify(pipeline);
    await streamPipeline(
      createReadStream(downloadPath),
      // eslint-disable-next-line new-cap
      Extract({ path: dir })
    );
    return join(dir, `${binaryName}.exe`);
  }

  throw new CLIError(`Unsupported file format: ${downloadPath}`);
};

export class ConnectClientVersionMismatchError extends CLIError {
  constructor(readonly expected: string, readonly reality: string) {
    super(
      `Autify Connect Client version mismatch: ${reality} !== ${expected} (expected)`
    );
  }
}

export const validateVersion = async (
  versionString: string,
  version: string
): Promise<void> => {
  // No need to validate version if it's installed as "stable".
  if (version === "stable") return;
  // Format example: Autify Connect version v0.6.1, build ca0972e
  if (!versionString.includes(version + ","))
    throw new ConnectClientVersionMismatchError(version, versionString);
};

const getWorkspaceDir = (cacheDir: string) =>
  join(cacheDir, "autifyconnect-install-workspace");

export const getInstallPath = (configDir: string, cacheDir: string): string => {
  const mode = getMode(configDir);
  const binaryName = mode === "fake" ? "autifyconnect-fake" : "autifyconnect";
  return getOs() === "windows"
    ? join(cacheDir, `${binaryName}.exe`)
    : join(cacheDir, binaryName);
};

export const getInstallVersion = async (path: string): Promise<string> => {
  if (!existsSync(path)) {
    throw new CLIError(
      `Autify Connect Client isn't installed yet at ${path}. Run \`autify connect client install\` first.`
    );
  }

  const { stderr } = await promisify(execFile)(path, ["--version"], {
    env,
  });
  const version = stderr.trim();
  if (version === "") throw new CLIError("Version is empty");
  return version;
};

export const installClient = async (
  configDir: string,
  cacheDir: string,
  version: string
): Promise<{ version: string; path: string }> => {
  const mode = getMode(configDir);
  const workspaceDir = getWorkspaceDir(cacheDir);
  // Clean up workspace in case something is left by previous command.
  if (existsSync(workspaceDir))
    rmSync(workspaceDir, { recursive: true, force: true });
  mkdirSync(workspaceDir);
  const downloadPath = await download(workspaceDir, mode, version);
  const extractPath = await extract(downloadPath);
  // Pre-install validation
  const preInstalledVersionString = await getInstallVersion(extractPath);
  await validateVersion(preInstalledVersionString, version);
  const installPath = getInstallPath(configDir, cacheDir);
  renameSync(extractPath, installPath);
  // Re-validate against the final path
  const versionString = await getInstallVersion(installPath);
  await validateVersion(versionString, version);
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
