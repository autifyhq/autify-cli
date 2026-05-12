import { spawn } from "node:child_process";

// The spawned child process is shell process. It's difficult to get the PID of the actuall mobilelink with Node's
// ChildProcess API. We insteadl use pkill command to kill mobilelink.
export const terminateStartProcess = () => {
  spawn("pkill", ["-f", "run link start"]);
};
