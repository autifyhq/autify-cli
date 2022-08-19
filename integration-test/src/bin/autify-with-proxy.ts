import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Polly } from "@pollyjs/core";
import NodeHttpAdapter from "@pollyjs/adapter-node-http";
import FSPersister from "@pollyjs/persister-fs";
import { spawn } from "node:child_process";
import { AddressInfo } from "node:net";
import path from "node:path";
import { argv, env, exit } from "node:process";
import { existsSync } from "node:fs";
import which from "which";

Polly.register(NodeHttpAdapter);
Polly.register(FSPersister);

type PollyMode = "record" | "replay";

const { AUTIFY_POLLY_RECORD, AUTIFY_CLI_PATH } = env;

const getPollyMode = (): PollyMode => {
  return AUTIFY_POLLY_RECORD ? "record" : "replay";
};

const getAutifyCli = (): string => {
  const autify = AUTIFY_CLI_PATH ?? "autify";
  if (!existsSync(autify) && !which.sync(autify))
    throw new Error(`Invalid autify-cli path: ${autify}`);
  return autify;
};

const createPolly = async (args: string[]) => {
  const mode = getPollyMode();
  // eslint-disable-next-line unicorn/prefer-module
  const scriptDir = __dirname;
  const recordingsDir = path.join(
    scriptDir,
    "..",
    "..",
    "__recordings__",
    encodeURIComponent(args.join(" "))
  );
  const polly = new Polly("polly-proxy", {
    mode,
    adapters: ["node-http"],
    persister: "fs",
    persisterOptions: {
      fs: {
        recordingsDir,
      },
    },
    recordIfMissing: false,
    flushRequestsOnStop: true,
    matchRequestsBy: {
      headers: false,
      body: (body, _) => {
        // Binary body is not recorded. Ignore for matching.
        if (typeof body !== "string") return "";
        return body;
      },
    },
  });
  // Remove headers because access token is included and also we don't care any other headers.
  polly.server.any().on("beforePersist", (_req, recording) => {
    recording.request.headers = [];
    recording.response.headers = [];
  });
  return polly;
};

const startProxy = (target: string) => {
  const app = express();
  app.use("", createProxyMiddleware({ target, changeOrigin: true }));
  const server = app.listen();
  const { port } = server.address() as AddressInfo;
  return { server, port };
};

type ProcStatus = [number | null, NodeJS.Signals | null];

const autifyWithProxy = async (args: string[]) => {
  const polly = await createPolly(args);
  const webProxy = startProxy("https://app.autify.com");
  const mobileProxy = startProxy("https://mobile-app.autify.com");
  const autify = getAutifyCli();
  const proc = spawn(autify, args, {
    env: {
      ...env,
      AUTIFY_WEB_BASE_PATH: `http://localhost:${webProxy.port}/api/v1/`,
      AUTIFY_MOBILE_BASE_PATH: `http://localhost:${mobileProxy.port}/api/v1/`,
    },
    stdio: "inherit",
    shell: true,
  });
  return new Promise<ProcStatus>((resolve, reject) => {
    proc.on("close", async (code, signal) => {
      webProxy.server.close();
      mobileProxy.server.close();
      await polly.stop();
      resolve([code, signal]);
    });
    proc.on("error", (error) => {
      reject(error);
    });
  });
};

const success = ([code, signal]: ProcStatus) => {
  if (code) {
    exit(code);
  } else if (signal) {
    fail(new Error(signal));
  }
};

const fail = (error: Error) => {
  console.error(error);
  exit(1);
};

const args = argv.slice(2);
autifyWithProxy(args).then(success).catch(fail);
