import { Hook } from "@oclif/core";
import { initializeProxy } from "../../autify/getProxySettings";

/**
 * Initialize proxy settings for all commands
 *
 * This ensures that any command using fetch() will automatically respect
 * HTTP_PROXY/HTTPS_PROXY environment variables and system proxy settings.
 *
 * The initialization is idempotent and lightweight - it only checks proxy
 * configuration once per command invocation.
 */
const hook: Hook<"init"> = async function () {
  await initializeProxy();
};

export default hook;
