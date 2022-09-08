import { execSync } from "node:child_process";
import path from "node:path";
import { argv, env } from "node:process";

// eslint-disable-next-line unicorn/prefer-module
const scriptDir = __dirname;
const rootDir = path.join(scriptDir, "..", "..");
const isRecord = Boolean(env.AUTIFY_CLI_INTEGRATION_TEST_RECORD);
const command = isRecord ? "test:record" : "test";
const args = argv.slice(2);
const testPathPattern =
  args.length === 0 ? "" : `--testPathPattern '(${args.join("|")})'`;

execSync(`npm run ${command} -- ${testPathPattern}`, {
  stdio: "inherit",
  cwd: rootDir,
});
