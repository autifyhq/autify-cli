import { Command, Flags } from "@oclif/core";
import { spawnClient } from "../../../autify/connect/spawnClient";

export default class ConnectClientStart extends Command {
  static description = "[Experimental] Start Autify Connect Client";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    verbose: Flags.boolean({
      description: "Make the operation more talkative.",
      default: false,
    }),
    "file-logging": Flags.boolean({
      description:
        "Logging Autify Connect Client log to a file instead of console.",
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(ConnectClientStart);
    const { configDir, cacheDir } = this.config;
    const verbose = flags.verbose;
    const fileLogging = flags["file-logging"];
    const { version, logFile, accessPointName, waitReady, waitExit } =
      await spawnClient(configDir, cacheDir, {
        verbose,
        fileLogging,
      });
    this.log(
      `Starting Autify Connect Client for Access Point "${accessPointName}" (${version})...`
    );
    if (logFile) this.log(`Log file is located at ${logFile}`);
    this.log("Waiting until Autify Connect Client is ready...");
    await waitReady();
    this.log("Autify Connect Client is ready!");
    const [code, signal] = await waitExit();
    this.log(
      `Autify Connect Client exited (code: ${code}, signal: ${signal}).`
    );
    this.exit(code ?? 1);
  }
}
