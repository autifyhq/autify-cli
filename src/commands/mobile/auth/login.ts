import { Command } from "@oclif/core";
import inquirer from "inquirer";
import { set } from "../../../config.js";

export default class MobileAuthLogin extends Command {
  static description = "Login to Autify for Mobile";

  static examples = [
    "Start interactive setup:\n<%= config.bin %> <%= command.id %>",
    "Reading the token from file:\n<%= config.bin %> <%= command.id %> < token.txt",
  ];

  public async run(): Promise<void> {
    await this.parse(MobileAuthLogin);
    const token = await this.readTokenFromStdin();
    set(this.config.configDir, "AUTIFY_MOBILE_ACCESS_TOKEN", token);
  }

  private async readTokenFromStdin() {
    const res = await inquirer.prompt([
      {
        name: "token",
        message: "Enter Access Token",
        type: "password",
        mask: true,
      },
    ]);
    return res.token as string;
  }
}
