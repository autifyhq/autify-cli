import { describe, expect, test } from "@jest/globals";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { AddressInfo, Socket } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { env } from "node:process";
import { getAutifyCliPath } from "../../test/helpers/get-autify-cli-path";

/**
 * Start a simple HTTP proxy server that supports CONNECT tunneling and tracks URLs
 */
const startTrackingProxy = () => {
  const proxiedUrls: string[] = [];

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    // Handle regular HTTP requests (not used by undici ProxyAgent for HTTPS)
    const fullUrl = req.url ?? "/";
    proxiedUrls.push(fullUrl);
    res.writeHead(200);
    res.end();
  });

  // Handle CONNECT method for HTTPS tunneling (used by undici ProxyAgent)
  server.on(
    "connect",
    (req: IncomingMessage, clientSocket: Socket, head: Buffer) => {
      const { port: targetPort, hostname: targetHostname } = new URL(
        `https://${req.url}`
      );

      proxiedUrls.push(`https://${req.url}`);

      // Connect to the target server
      const serverSocket = new Socket();
      serverSocket.connect(Number(targetPort) || 443, targetHostname, () => {
        clientSocket.write(
          "HTTP/1.1 200 Connection Established\r\n" +
            "Proxy-agent: Node.js-Proxy\r\n" +
            "\r\n"
        );
        serverSocket.write(head);
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
      });

      serverSocket.on("error", () => {
        clientSocket.end();
      });
    }
  );

  server.listen();
  const { port } = server.address() as AddressInfo;

  return {
    server,
    port,
    getProxiedUrls: () => proxiedUrls,
  };
};

/**
 * Run autify CLI command with proxy configuration
 */
const runAutifyWithProxy = async (
  command: string[],
  proxyPort: number,
  cacheDir: string,
  useFakeMode = false
): Promise<{ exitCode: number | null; stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const autifyPath = getAutifyCliPath();

    const testEnv: Record<string, string> = {
      ...env,
      HTTP_PROXY: `http://127.0.0.1:${proxyPort}`,
      HTTPS_PROXY: `http://127.0.0.1:${proxyPort}`,
      // Don't use proxy for these hosts
      NO_PROXY: "localhost,127.0.0.1",
      // Use test cache directory
      XDG_CACHE_HOME: cacheDir,
    };

    // Use fake mode for autifyconnect to avoid interactive prompts
    if (useFakeMode) {
      testEnv.AUTIFY_CONNECT_CLIENT_MODE = "fake";
    }

    const proc = spawn(autifyPath, command, {
      env: testEnv,
      shell: process.platform === "win32",
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (exitCode) => {
      resolve({ exitCode, stdout, stderr });
    });

    proc.on("error", (error) => {
      reject(error);
    });
  });
};

/**
 * Clean up default cache directory (not the test cache)
 * This ensures a fresh download for testing proxy behavior
 */
const cleanupDefaultCache = async () => {
  const cachePaths = [
    // macOS
    path.join(env.HOME ?? "", "Library", "Caches", "autify"),
    // Linux/XDG
    path.join(env.HOME ?? "", ".cache", "autify"),
    // Windows (LOCALAPPDATA)
    env.LOCALAPPDATA ? path.join(env.LOCALAPPDATA, "autify") : null,
    // Windows fallback (APPDATA)
    env.APPDATA ? path.join(env.APPDATA, "autify") : null,
  ].filter((p): p is string => p !== null && existsSync(p));

  await Promise.all(
    cachePaths.map((cachePath) =>
      rm(cachePath, { recursive: true, force: true })
    )
  );
};

describe("Proxy Integration Tests", () => {
  let proxyServer: ReturnType<typeof startTrackingProxy>;
  let testCacheDir: string;

  beforeEach(async () => {
    // Clean up any existing cached binaries
    await cleanupDefaultCache();

    // Create temporary cache directory for this test
    testCacheDir = await mkdtemp(path.join(tmpdir(), "autify-test-"));

    // Start tracking proxy
    proxyServer = startTrackingProxy();
  });

  afterEach(async () => {
    if (proxyServer) {
      proxyServer.server.close();
    }

    // Clean up test cache directory
    if (testCacheDir && existsSync(testCacheDir)) {
      await rm(testCacheDir, { recursive: true, force: true });
    }
  });

  test("autify connect client install should use proxy when HTTP_PROXY is set", async () => {
    const { exitCode } = await runAutifyWithProxy(
      ["connect", "client", "install"],
      proxyServer.port,
      testCacheDir
    );

    expect(exitCode).toBe(0);

    // Verify that the autifyconnect binary download went through the proxy
    const proxiedUrls = proxyServer.getProxiedUrls();
    const autifyconnectDownload = proxiedUrls.find((url) =>
      url.includes("autifyconnect.s3")
    );

    expect(autifyconnectDownload).toBeDefined();
    expect(autifyconnectDownload).toContain(
      "autifyconnect.s3.ap-northeast-1.amazonaws.com"
    );
  }, 60_000);
});
