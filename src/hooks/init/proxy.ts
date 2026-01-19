import { Hook } from "@oclif/core";
import { initializeProxy } from "../../autify/getProxySettings";

/**
 * Commands that require proxy initialization for downloading binaries
 */
const COMMANDS_REQUIRING_PROXY = new Set([
  "connect:client:install",
  "mobile:link:setup",
]);

/**
 * Initialize proxy settings for commands that download binaries
 */
const hook: Hook<"init"> = async function (opts) {
  if (COMMANDS_REQUIRING_PROXY.has(opts.id ?? "")) {
    await initializeProxy();
  }
};

export default hook;
