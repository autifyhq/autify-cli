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
import { crossExecFilePromise } from "../../child-process";

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

const baseUrl =
  "https://autifyconnect.s3.ap-northeast-1.amazonaws.com/autifyconnect/versions/stable";
const getUrl = () => {
  const os = getOs();
  const arch = getArch();
  const ext = getExt();
  return new URL(`${baseUrl}/autifyconnect_${os}_${arch}.${ext}`);
};

const download = async (workspaceDir: string) => {
  const url = getUrl();
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
  if (file.endsWith(".tar.gz")) {
    // TODO: Pure JS
    await crossExecFilePromise("tar", ["xvzf", file], { cwd: dir });
    return join(dir, "autifyconnect");
  }

  if (file.endsWith(".zip")) {
    const streamPipeline = promisify(pipeline);
    await streamPipeline(
      createReadStream(downloadPath),
      // eslint-disable-next-line new-cap
      Extract({ path: dir })
    );
    return join(dir, "autifyconnect.exe");
  }

  throw new CLIError(`Unsupported file format: ${downloadPath}`);
};

const validateVersion = async (path: string, installPath: string) => {
  try {
    return await getInstallVersion(path, installPath);
  } catch (error) {
    throw new CLIError(
      `Autify Connect Client binary doesn't work properly (path: ${path}, error: ${error})`
    );
  }
};

const getWorkspaceDir = (cacheDir: string) =>
  join(cacheDir, "autifyconnect-install-workspace");

export const getInstallPath = (cacheDir: string): string =>
  getOs() === "windows"
    ? join(cacheDir, "autifyconnect.exe")
    : join(cacheDir, "autifyconnect");

export const getInstallVersion = async (
  path: string,
  installPath: string
): Promise<string> => {
  if (!existsSync(path)) {
    const error =
      path === installPath
        ? new CLIError(
            `Autify Connect Client isn't installed yet at ${path}. Run \`autify connect client install\` first.`
          )
        : new CLIError(
            `Autify Connect Client isn't installed specified location ${path}.`
          );
    throw error;
  }

  const { stderr } = await crossExecFilePromise(path, ["--version"], {
    env: {
      ...env,
      // For fake command
      AUTIFY_CONNECT_CLIENT_INSTALL_PATH: installPath,
    },
  });
  const version = stderr.trim();
  if (version === "") throw new CLIError("Version is empty");
  return version;
};

export const installClient = async (
  cacheDir: string
): Promise<{ version: string; path: string }> => {
  const workspaceDir = getWorkspaceDir(cacheDir);
  // Clean up workspace in case something is left by previous command.
  if (existsSync(workspaceDir))
    rmSync(workspaceDir, { recursive: true, force: true });
  mkdirSync(workspaceDir);
  const downloadPath = await download(workspaceDir);
  const extractPath = await extract(downloadPath);
  // Pre-install validation
  const installPath = getInstallPath(cacheDir);
  await validateVersion(extractPath, installPath);
  renameSync(extractPath, installPath);
  const version = await validateVersion(installPath, installPath);
  // Clean up workspace. Ignore any exception as install is already done.
  try {
    rmSync(workspaceDir, { recursive: true, force: true });
  } catch (error) {
    console.error(
      `Workspace clean up failed. Ignoring because already installed. (error: ${error})`
    );
  }

  return {
    version,
    path: installPath,
  };
};
