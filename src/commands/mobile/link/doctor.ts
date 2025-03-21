import { Command, Flags } from "@oclif/core";
import { MobileLinkManager } from "../../../autify/mobile/mobilelink/mobile-link-manager/MobileLinkManager";

export default class MobileLinkDoctor extends Command {
  static description = "Check MobileLink configuration";
  static examples = [
    "Check MobileLink configuration:\n<%= config.bin %> <%= command.id %>",
  ];
  static flags = {
    "zarnath-protocol": Flags.integer({
      description: "Specify the version of zarnath protocol",
      required: true,
    }),
  };
  static strict = false;

  public async run(): Promise<void> {
    console.log("argv before parse", this.argv);
    const { flags } = await this.parse(MobileLinkDoctor);
    console.log("argv after parse", this.argv);
    console.log("flags", flags);
    const { configDir, cacheDir } = this.config;

    const mobileLinkManager = new MobileLinkManager({
      configDir,
      cacheDir,
    });
    await mobileLinkManager.doctor();
  }
}
