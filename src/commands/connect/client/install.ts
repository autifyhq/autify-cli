import { CliUx, Command } from "@oclif/core";
import {
  AUTIFY_CONNECT_CLIENT_SUPPORTED_VERSION,
  installClient,
} from "../../../autify/connect/installClient";

export default class ConnectClientInstall extends Command {
  static description = "[Experimental] Install Autify Connect Client";

  static examples = [
    "(Recommended) Install the supported version:\n<%= config.bin %> <%= command.id %>",
    "Install a specific version:\n<%= config.bin %> <%= command.id %> v0.6.1",
    "Install a stable version:\n<%= config.bin %> <%= command.id %> stable",
  ];

  static flags = {};

  static args = [
    {
      name: "version",
      description: "Specify the target version of Autify Connect Client.",
      default: AUTIFY_CONNECT_CLIENT_SUPPORTED_VERSION,
    },
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(ConnectClientInstall);
    const { configDir, cacheDir } = this.config;
    CliUx.ux.action.start(
      `Installing Autify Connect Client (version: ${args.version})`,
      "installing",
      { stdout: true }
    );
    const { version, path } = await installClient(
      configDir,
      cacheDir,
      args.version as string
    );
    CliUx.ux.action.stop();
    this.log(
      `Successfully installed Autify Connect Client (path: ${path}, version: ${version})`
    );
  }
}
