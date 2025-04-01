import { spawn } from "node:child_process";

export const killStartProcess = () => {
  spawn("pkill", ["-f", "run link start"]);
};
