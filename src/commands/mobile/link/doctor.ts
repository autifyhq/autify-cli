import { Command } from "@oclif/core";
import { MobileLinkManager } from "../../../autify/mobile/mobilelink/mobile-link-manager/MobileLinkManager";

export default class MobileLinkDoctor extends Command {
  static description = "Check MobileLink configuration";
  static examples = [
    "Check MobileLink configuration:\n<%= config.bin %> <%= command.id %>",
  ];

  public async run(): Promise<void> {
    const { configDir, cacheDir } = this.config;

    const mobileLinkManager = new MobileLinkManager({
      configDir,
      cacheDir,
    });
    await mobileLinkManager.doctor();
  }
}
