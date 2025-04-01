import { spawn } from "node:child_process";

export const terminateStartProcess = () => {
  spawn("pkill", ["-f", "run link start"]);
};
