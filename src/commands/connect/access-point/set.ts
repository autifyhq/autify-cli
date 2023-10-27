import { Command, Flags } from "@oclif/core";
import * as inquirer from "inquirer";

import {
  confirmOverwriteAccessPoint,
  saveAccessPoint,
} from "../../../autify/connect/accessPointConfig";

export default class ConnectAccessPointSet extends Command {
  static description = "Set Autify Connect Access Point";

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
    const { name } = flags;
    const { configDir } = this.config;
    await confirmOverwriteAccessPoint(configDir);
    const key = await this.readKeyFromStdin();
    this.log(saveAccessPoint(configDir, name, key));
  }

  private async readKeyFromStdin() {
    const res = await inquirer.prompt([
      {
        mask: true,
        message: "Enter Autify Connect Access Point Key",
        name: "key",
        type: "password",
      },
    ]);
    return res.key as string;
  }
}
