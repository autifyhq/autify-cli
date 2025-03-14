import { Args, Command } from "@oclif/core";
import { MobileLinkManager } from "../../../autify/mobile/mobilelink/mobile-link-manager/MobileLinkManager";

export default class MobileLinkStart extends Command {
  static description = "Start MobileLink session";
  static examples = [
    "Pass subcommand arguments to mobilelink:\n<%= config.bin %> <%= command.id %> ABC XYZ",
  ];
  static flags = {};
  static args = {
    workspaceId: Args.string({
      description: "Specify the target version of Autify Connect Client.",
    }),
  };
  static strict = false;

  public async run(): Promise<void> {
    const { args } = await this.parse(MobileLinkStart);
    const { configDir, cacheDir } = this.config;
    const mobileLinkManager = new MobileLinkManager({
      configDir,
      cacheDir,
    });
    this.log("Starting MobileLink...");
    await mobileLinkManager.start(args.workspaceId);
    this.log("Waiting until MobileLink is ready...");
    await mobileLinkManager.onceReady();
    this.log("Waiting for terminating (forever)...");
    await mobileLinkManager.onceTerminating();
    this.log("Waiting until MobileLink exits...");
    const exitCode = (await mobileLinkManager.onceDone()) ?? 1;
    this.log(`Exiting this command with the same exit code(${exitCode})...`);
    this.exit(exitCode);
  }
}
