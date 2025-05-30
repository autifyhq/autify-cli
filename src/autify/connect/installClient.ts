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
import { get } from "../../config";

// Update whenever to bump supported version.
export const AUTIFY_CONNECT_CLIENT_SUPPORTED_VERSION = "v1.1.46";

type ClientMode = "fake" | "real";

const getMode = (configDir: string): ClientMode => {
  const mode = get(configDir, "AUTIFY_CONNECT_CLIENT_MODE");
  if (!mode) return "real";
  if (!["fake", "real"].includes(mode))
    throw new Errors.CLIError(
      `Unknown value is specified by AUTIFY_CONNECT_CLIENT_MODE: ${mode}`
    );
  return mode as ClientMode;
};

const getOs = () => {
  const os = platform;
  if (os === "linux") return "linux";
  if (os === "darwin") return "darwin";
  if (os === "win32") return "windows";
  throw new Errors.CLIError(`Unsupported OS: ${os}`);
};

const getArch = () => {
  if (arch === "ia32") return "386";
  if (arch === "x64") return "amd64";
  if (arch === "arm64") return "arm64";
  throw new Errors.CLIError(`Unsupported Architecture: ${arch}`);
};

const getExt = () => (getOs() === "windows" ? "zip" : "tar.gz");

const realBaseUrl =
  "https://autifyconnect.s3.ap-northeast-1.amazonaws.com/autifyconnect/versions";
const fakeBaseUrl =
  "https://autifyconnect.s3.ap-northeast-1.amazonaws.com/fake/versions";
export const getConnectClientSourceUrl = (
  configDir: string,
  version: string
): { url: URL; expectedVersion: string | undefined } => {
  const customUrl = get(configDir, "AUTIFY_CONNECT_CLIENT_SOURCE_URL");
  if (customUrl)
    return {
      url: new URL(customUrl),
      expectedVersion: undefined,
    };
  const mode = getMode(configDir);
  const baseUrl = mode === "fake" ? fakeBaseUrl : realBaseUrl;
  const prefix = mode === "fake" ? "autifyconnect-fake" : "autifyconnect";
  const os = getOs();
  const arch = getArch();
  const ext = getExt();
  return {
    url: new URL(`${baseUrl}/${version}/${prefix}_${os}_${arch}.${ext}`),
    expectedVersion: version,
  };
};

const download = async (workspaceDir: string, url: URL) => {
  const downloadPath = join(workspaceDir, basename(url.pathname));
  const response = await fetch(url);
  if (!response.ok)
    throw new Errors.CLIError(`Failed to fetch ${url}: ${response.status}`);
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

  const files = readdirSync(dir);
  const binary = files.find((file) => file.startsWith("autifyconnect"));
  if (!binary)
    throw new Errors.CLIError(`Cannot find any autifyconnect binary in ${dir}`);
  return join(dir, binary);
};

export class ConnectClientVersionMismatchError extends Errors.CLIError {
  constructor(
    readonly expected: string,
    readonly reality: string
  ) {
    super(
      `Autify Connect Client version mismatch: ${reality} !== ${expected} (expected)`
    );
  }
}

export const validateVersion = async (
  versionString: string,
  version: string | undefined
): Promise<void> => {
  // No need to validate version if it's installed as "stable" or undefined.
  if (!version || version === "stable") return;
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
    throw new Errors.CLIError(
      `Autify Connect Client isn't installed yet at ${path}. Run \`autify connect client install\` first.`
    );
  }

  const { stderr } = await promisify(execFile)(path, ["--version"], {
    env,
  });
  const version = stderr.trim();
  if (version === "") throw new Errors.CLIError("Version is empty");
  return version;
};

export const installClient = async (
  configDir: string,
  cacheDir: string,
  url: URL,
  version: string | undefined
): Promise<{ version: string; path: string }> => {
  const workspaceDir = getWorkspaceDir(cacheDir);
  // Clean up workspace in case something is left by previous command.
  if (existsSync(workspaceDir))
    rmSync(workspaceDir, { recursive: true, force: true });
  mkdirSync(workspaceDir, { recursive: true });
  const downloadPath = await download(workspaceDir, url);
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
