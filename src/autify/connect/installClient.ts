/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";
import { arch, platform } from "node:process";
import fetch from "node-fetch";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { basename, dirname, join } from "node:path";
import { execSync } from "node:child_process";
import { Extract } from "unzip-stream";

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

const download = async (cacheDir: string) => {
  const url = getUrl();
  const downloadPath = join(cacheDir, basename(url.pathname));
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
    const command = `tar xvzf ${file}`;
    execSync(command, { cwd: dir });
  }

  if (file.endsWith(".zip")) {
    const streamPipeline = promisify(pipeline);
    await streamPipeline(
      createReadStream(downloadPath),
      // eslint-disable-next-line new-cap
      Extract({ path: dir })
    );
  }
};

const getClientPath = (cacheDir: string) =>
  getOs() === "windows"
    ? join(cacheDir, "autifyconnect.exe")
    : join(cacheDir, "autifyconnect");

export const installClient = async (cacheDir: string): Promise<string> => {
  const clientPath = getClientPath(cacheDir);
  if (existsSync(clientPath)) return clientPath;
  const downloadPath = await download(cacheDir);
  await extract(downloadPath);
  return clientPath;
};
