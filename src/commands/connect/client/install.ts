import { Args, Command, ux } from "@oclif/core";

import {
  AUTIFY_CONNECT_CLIENT_SUPPORTED_VERSION,
  getConnectClientSourceUrl,
  installClient,
} from "../../../autify/connect/installClient";

export default class ConnectClientInstall extends Command {
  static args = {
    version: Args.string({
      default: AUTIFY_CONNECT_CLIENT_SUPPORTED_VERSION,
      description: "Specify the target version of Autify Connect Client.",
    }),
  };

  static description = "Install Autify Connect Client";

  static examples = [
    "(Recommended) Install the supported version:\n<%= config.bin %> <%= command.id %>",
    "Install a specific version:\n<%= config.bin %> <%= command.id %> v0.6.1",
    "Install a stable version:\n<%= config.bin %> <%= command.id %> stable",
  ];

  static flags = {};

  public async run(): Promise<void> {
    const { args } = await this.parse(ConnectClientInstall);
    const { cacheDir, configDir } = this.config;
    const { expectedVersion, url } = getConnectClientSourceUrl(
      configDir,
      args.version as string
    );
    ux.action.start(
      `Installing Autify Connect Client from ${url})`,
      "installing",
      { stdout: true }
    );
    const { path, version } = await installClient(
      configDir,
      cacheDir,
      url,
      expectedVersion
    );
    ux.action.stop();
    this.log(
      `Successfully installed Autify Connect Client (path: ${path}, version: ${version})`
    );
  }
}
