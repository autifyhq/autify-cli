import { Command, Flags } from "@oclif/core";
import * as inquirer from "inquirer";
import { set } from "../../../config";

export default class ConnectAccessPointSet extends Command {
  static description = "[Experimental] Set Autify Connect Access Point";

  static examples = [
    "Start interactive setup:\n<%= config.bin %> <%= command.id %> --name=NAME",
    "Reading the key from file:\n<%= config.bin %> <%= command.id %> --name=NAME < key.txt",
  ];

  static flags = {
    name: Flags.string({
      description: "Name of the Autify Connect Access Point already created",
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(ConnectAccessPointSet);
    const key = await this.readKeyFromStdin();
    set(this.config.configDir, "AUTIFY_CONNECT_ACCESS_POINT_NAME", flags.name);
    set(this.config.configDir, "AUTIFY_CONNECT_ACCESS_POINT_KEY", key);
  }

  private async readKeyFromStdin() {
    const res = await inquirer.prompt([
      {
        name: "key",
        message: "Enter Autify Connect Access Point Key",
        type: "password",
        mask: true,
      },
    ]);
    return res.key as string;
  }
}
