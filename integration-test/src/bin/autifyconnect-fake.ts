import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { argv, env, exit } from "node:process";
import { setInterval } from "node:timers/promises";
import { promisify } from "node:util";

const info = (msg: string) =>
  console.log(
    JSON.stringify({
      level: "info",
      msg,
    })
  );

const main = async () => {
  if (argv.length === 3 && argv[2] === "--version") {
    const installPath = env.AUTIFY_CONNECT_CLIENT_INSTALL_PATH;
    if (!installPath) return 1;
    if (!existsSync(installPath)) {
      console.error(`Autify Connect Client isn't installed yet ${installPath}`);
      return 1;
    }

    const { stdout, stderr } = await promisify(execFile)(installPath, [
      "--version",
    ]);
    process.stdout.write(stdout);
    process.stderr.write(stderr);
    return 0;
  }

  info(
    'Starting to establish a secure connection with the Autify connect server. Your session ID is "fake".'
  );
  info("Successfully connected!");

  let killed = false;
  process.on("SIGINT", () => {
    killed = true;
  });
  process.on("SIGTERM", () => {
    killed = true;
  });

  const timeoutSecond = 60;
  for await (const startTime of setInterval(1000, Date.now())) {
    if (killed) break;
    const now = Date.now();
    if (now - startTime > timeoutSecond * 1000) {
      return 1;
    }
  }

  info("Interrupt received.");
  info("Shutdown completed.");
  return 0;
};

main().then(exit);
