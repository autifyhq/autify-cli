import { Command } from "@oclif/core";
import { installClient } from "../../../autify/connect/installClient";

export default class ConnectClientInstall extends Command {
  static description =
    "[Experimental] Install the latest stable version of Autify Connect Client";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {};

  static args = [];

  public async run(): Promise<void> {
    await this.parse(ConnectClientInstall);
    const { cacheDir } = this.config;
    const { version, path } = await installClient(cacheDir);
    this.log(
      `Successfully installed Autify Connect Client (path: ${path}, version: ${version})`
    );
  }
}
