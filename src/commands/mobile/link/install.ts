import { ux, Command } from "@oclif/core";
import {
  getMobileLinkSourceUrl,
  installBinary,
} from "../../../autify/mobile/mobilelink/installBinary";

export default class MobileLinkInstall extends Command {
  static description = "Install Mobile Link";
  static examples = [
    "(Recommended) Install the stable version:\n<%= config.bin %> <%= command.id %>",
  ];
  static flags = {};

  public async run(): Promise<void> {
    const { configDir, cacheDir } = this.config;
    const url = getMobileLinkSourceUrl(configDir);
    ux.action.start(`Installing Mobile Link from ${url})`, "installing", {
      stdout: true,
    });
    const { version, path } = await installBinary(cacheDir, url);
    ux.action.stop();
    this.log(
      `Successfully installed Mobile Link (path: ${path}, version: ${version})`
    );
  }
}
