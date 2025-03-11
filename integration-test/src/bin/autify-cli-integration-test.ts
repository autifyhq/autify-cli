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
  env: {
    ...process.env,
    // The global navigator object brings lots of errors since Node.js doesn't support the onLine property yet.
    // https://github.com/Netflix/pollyjs/blob/9b6bede12b7ee998472b8883c9dd01e2159e00a8/packages/%40pollyjs/adapter/src/index.js#L186
    // We need to disable the navigator until Node.js supports it.
    NODE_OPTIONS: "--no-deprecation --no-experimental-global-navigator",
  },
  cwd: rootDir,
});
