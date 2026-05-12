import { Args, Command, Flags } from "@oclif/core";
import { MobileLinkManager } from "../../../autify/mobile/mobilelink/mobile-link-manager/MobileLinkManager";

export default class MobileLinkStart extends Command {
  static description = "Start MobileLink session";
  static examples = [
    "Pass subcommand arguments to mobilelink:\n<%= config.bin %> <%= command.id %> ABC XYZ",
  ];
  static flags = {
    "extra-arguments": Flags.string({
      description:
        'Extra args for Autify Connect Client e.g. "--tunnel-proxy http://proxy"',
    }),
  };
  static args = {
    workspaceId: Args.string({
      description: "Specify the target version of Autify Connect Client.",
    }),
  };
  static strict = false;

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(MobileLinkStart);
    const { configDir, cacheDir } = this.config;
    const mobileLinkManager = new MobileLinkManager({
      configDir,
      cacheDir,
      extraArguments: flags["extra-arguments"],
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
