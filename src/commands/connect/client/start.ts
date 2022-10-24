import { Command, Flags } from "@oclif/core";
import { ClientManager } from "../../../autify/connect/client-manager/ClientManager";

export default class ConnectClientStart extends Command {
  static description = "Start Autify Connect Client";

  static examples = [
    "With pre-created Access Point:\n<%= config.bin %> <%= command.id %>",
    "With ephemeral Access Point of Autify for Web:\n<%= config.bin %> <%= command.id %> --web-workspace-id 000",
  ];

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
    "debug-server-port": Flags.integer({
      description: `The server for debugging and monitoring launches on your local machine on the given port. It will use a radom port if not specified.`,
    }),
    "web-workspace-id": Flags.integer({
      description:
        "Workspace ID of Autify for Web to create an ephemeral Access Point. If not specified, it will use the one configured by `autify connect access-point create/set`, instead.",
    }),
    "extra-arguments": Flags.string({
      description:
        'Extra command line arguments you want to pass to Autify Connect Client e.g. "--experiment-tunnel-proxy http://proxy".',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(ConnectClientStart);
    const { configDir, cacheDir, userAgent } = this.config;
    const clientManager = await ClientManager.create({
      configDir,
      cacheDir,
      userAgent,
      verbose: flags.verbose,
      fileLogging: flags["file-logging"],
      debugServerPort: flags["debug-server-port"],
      webWorkspaceId: flags["web-workspace-id"],
      extraArguments: flags["extra-arguments"],
    });
    this.log("Starting Autify Connect Client...");
    await clientManager.start();
    this.log("Waiting until Autify Connect Client is ready...");
    await clientManager.onceReady();
    this.log("Waiting for terminating (forever)...");
    await clientManager.onceTerminating();
    this.log("Waiting until Autify Connect Client exits...");
    const exitCode = (await clientManager.onceDone()) ?? 1;
    this.log(`Exiting this command with the same exit code(${exitCode})...`);
    this.exit(exitCode);
  }
}
