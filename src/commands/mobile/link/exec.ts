import { Args, Command } from "@oclif/core";
import { MobileLinkManager } from "../../../autify/mobile/mobilelink/mobile-link-manager/MobileLinkManager";

export default class MobileLinkExec extends Command {
  static description = "Execute arbitrary MobileLink subcommand";
  static examples = [
    "Pass subcommand arguments to mobilelink:\n<%= config.bin %> <%= command.id %> ABC XYZ",
  ];
  static args = {
    things: Args.string(),
  };
  static strict = false;

  public async run(): Promise<void> {
    const { configDir, cacheDir } = this.config;
    const mobileLinkManager = new MobileLinkManager({
      configDir,
      cacheDir,
    });
    await mobileLinkManager.exec(this.argv);
  }
}
