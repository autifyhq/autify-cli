import NodeHttpAdapter from "@pollyjs/adapter-node-http";
import { Polly, Request } from "@pollyjs/core";
import { HarEntry, HarRequest } from "@pollyjs/persister";
import FSPersister from "@pollyjs/persister-fs";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { AddressInfo } from "node:net";
import path from "node:path";
import { argv, env, exit } from "node:process";
import { sync } from "which";

import { normalizeCommand } from "../commands";

Polly.register(NodeHttpAdapter);
Polly.register(FSPersister);

type PollyMode = "record" | "replay";

const { AUTIFY_CLI_PATH, AUTIFY_POLLY_RECORD } = env;

const getPollyMode = (): PollyMode =>
  AUTIFY_POLLY_RECORD ? "record" : "replay";

const getAutifyCli = (): string => {
  let autify = AUTIFY_CLI_PATH ?? "autify";
  if (process.platform === "win32") {
    autify += ".cmd";
  }

  if (!existsSync(autify) && !sync(autify))
    throw new Error(`Invalid autify-cli path: ${autify}`);
  return autify;
};

const isEndpoint = (
  request: HarRequest | Request,
  method: string,
  pathnameRegExp: RegExp
) => {
  const { pathname } = new URL(request.url);
  return method === request.method && pathnameRegExp.test(pathname);
};

const isCreateAccessPoint = (request: HarRequest | Request) =>
  isEndpoint(
    request,
    "POST",
    /\/api\/v1\/projects\/[^/]+\/autify_connect\/access_points/
  );
const isDeleteAccessPoint = (request: HarRequest | Request) =>
  isEndpoint(
    request,
    "DELETE",
    /\/api\/v1\/projects\/[^/]+\/autify_connect\/access_points/
  );

const ignoreBody = (request: HarRequest | Request) => {
  if (isCreateAccessPoint(request) || isDeleteAccessPoint(request)) return true;
};

const filterRecording = ({ request, response }: HarEntry) => {
  if (isCreateAccessPoint(request)) {
    response.content.text = response.content.text?.replace(
      /"key":"[^"]+"/,
      `"key":"000000000000000000000000000000"`
    );
  }
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
    adapters: ["node-http"],
    flushRequestsOnStop: true,
    matchRequestsBy: {
      body(body, request) {
        // Binary body is not recorded. Ignore for matching.
        if (typeof body !== "string") return "";
        if (ignoreBody(request)) return "";
        return body;
      },
      headers: false,
    },
    mode,
    persister: "fs",
    persisterOptions: {
      fs: {
        recordingsDir,
      },
    },
    recordIfMissing: false,
  });
  // Remove headers because access token is included and also we don't care any other headers.
  polly.server.any().on("beforePersist", (_req, recording) => {
    recording.request.headers = [];
    recording.response.headers = [];
    filterRecording(recording);
  });
  return polly;
};

const startProxy = (target: string) => {
  const app = express();
  app.use("", createProxyMiddleware({ changeOrigin: true, target }));
  const server = app.listen();
  const { port } = server.address() as AddressInfo;
  return { port, server };
};

type ProcStatus = [null | number, NodeJS.Signals | null];

const autifyWithProxy = async (originalArgs: string[]) => {
  const args = normalizeCommand(originalArgs);
  const polly = await createPolly(args);
  const webProxy = startProxy("https://app.autify.com");
  const mobileProxy = startProxy("https://mobile-app.autify.com");
  const autify = getAutifyCli();
  const proc = spawn(autify, args, {
    env: {
      AUTIFY_CONNECT_CLIENT_MODE: "fake",
      ...env,
      AUTIFY_MOBILE_BASE_PATH: `http://127.0.0.1:${mobileProxy.port}/api/v1/`,
      AUTIFY_WEB_BASE_PATH: `http://127.0.0.1:${webProxy.port}/api/v1/`,
    },
    stdio: "inherit",
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
