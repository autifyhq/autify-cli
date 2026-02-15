import { Hook } from "@oclif/core";
import { initializeProxy } from "../../autify/getProxySettings";

/**
 * Initialize proxy settings for all commands
 *
 * This ensures that any command using fetch() will automatically respect
 * HTTP_PROXY/HTTPS_PROXY environment variables and system proxy settings.
 *
 * For mobile link commands, also reads --extra-arguments for --tunnel-proxy
 * and --experimental-no-ssl-verify (highest priority when present).
 *
 * The initialization is idempotent and lightweight - it only checks proxy
 * configuration once per command invocation.
 */
const hook: Hook<"init"> = async function (options) {
  await initializeProxy({
    id: options.id,
    argv: options.argv,
  });
};

export default hook;
