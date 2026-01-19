import { env } from "node:process";

/**
 * Get the Autify CLI path for testing.
 *
 * Uses AUTIFY_CLI_PATH env var if set, otherwise falls back to "autify" (globally installed).
 *
 * To test with dev CLI, set: AUTIFY_CLI_PATH=../bin/dev
 *
 * Same pattern as:
 * - e2e-test/mobile/get-autify-cli-path.ts
 * - integration-test/src/bin/autify-with-proxy.ts getAutifyCli()
 */
export const getAutifyCliPath = (): string => {
  return env.AUTIFY_CLI_PATH ?? "autify";
};
