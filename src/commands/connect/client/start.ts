import { Command, Flags } from "@oclif/core";
import { spawnClient } from "../../../autify/connect/spawnClient";

export default class ConnectClientStart extends Command {
  static description = "Start Autify Connect Client";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "client-args-override": Flags.string({
      description:
        'Command line argument to override when starting Autify Connect Client e.g. "--verbose --log-format json"',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(ConnectClientStart);
    const { configDir, cacheDir } = this.config;
    const clientArgs = flags["client-args-override"];
    const { accessPoint, waitExit } = await spawnClient(configDir, cacheDir, {
      clientArgs,
    });
    this.log(
      `Starting Autify Connect Client for Access Point "${accessPoint}"...`
    );
    const code = await waitExit();
    this.exit(code);
  }
}
