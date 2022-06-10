import { execSync } from "node:child_process";
import path from "node:path";
import { argv } from "node:process";

// eslint-disable-next-line unicorn/prefer-module
const scriptDir = __dirname;
const rootDir = path.join(scriptDir, "..", "..");
const isRecord = argv[2] === "--record";
const command = isRecord ? "test:record" : "test";
execSync(`npm run ${command}`, {
  stdio: "inherit",
  cwd: rootDir,
});
