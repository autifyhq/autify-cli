import { ux, Command } from "@oclif/core";
import {
  installBinary,
  getMobileLinkSourceUrl,
  getBinaryPath,
} from "../../../autify/mobile/mobilelink/installBinary";
import { MobileLinkManager } from "../../../autify/mobile/mobilelink/mobile-link-manager/MobileLinkManager";
import { existsSync } from "node:fs";
import {
  getConnectClientSourceUrl,
  getInstallPath,
  installClient,
} from "../../../autify/connect/installClient";

export default class MobileLinkSetup extends Command {
  static description = "Set up MobileLink";
  static examples = [
    "Set up MobileLink configuration:\n<%= config.bin %> <%= command.id %>",
  ];

  public async run(): Promise<void> {
    const { configDir, cacheDir } = this.config;

    const autifyConnectInstallPath = getInstallPath(configDir, cacheDir);
    if (existsSync(autifyConnectInstallPath)) {
      this.log(`AutifyConnect is already installed. Skipping installation`);
    } else {
      const { url, expectedVersion } = getConnectClientSourceUrl(
        configDir,
        "stable"
      );
      ux.action.start(
        `Installing Autify Connect Client from ${url})`,
        "installing",
        { stdout: true }
      );
      const { version, path } = await installClient(
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

    if (existsSync(getBinaryPath(cacheDir))) {
      this.log(`MobileLink is already installed. Skipping installation`);
    } else {
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

    const mobileLinkManager = new MobileLinkManager({
      configDir,
      cacheDir,
    });
    await mobileLinkManager.setup();
  }
}
