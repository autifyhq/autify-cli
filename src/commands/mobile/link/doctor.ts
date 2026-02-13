import { Command, Flags } from "@oclif/core";
import { MobileLinkManager } from "../../../autify/mobile/mobilelink/mobile-link-manager/MobileLinkManager";

export default class MobileLinkDoctor extends Command {
  static description = "Check MobileLink configuration";
  static examples = [
    "Check MobileLink configuration:\n<%= config.bin %> <%= command.id %>",
  ];
  static flags = {
    "extra-arguments": Flags.string({
      description:
        'Extra args for Autify Connect Client e.g. "--tunnel-proxy http://proxy"',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(MobileLinkDoctor);
    const { configDir, cacheDir } = this.config;

    const mobileLinkManager = new MobileLinkManager({
      configDir,
      cacheDir,
      extraArguments: flags["extra-arguments"],
    });
    await mobileLinkManager.doctor();
  }
}
