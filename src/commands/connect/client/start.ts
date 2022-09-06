import { WebClient } from "@autifyhq/autify-sdk";
import { Command, Flags } from "@oclif/core";
import { spawnClient } from "../../../autify/connect/spawnClient";
import { get, getOrThrow } from "../../../config";

const createEphemeralAccessPointIfNeeded = (
  configDir: string,
  userAgent: string,
  workspaceId?: number
) => {
  if (!workspaceId) return;
  const accessToken = getOrThrow(configDir, "AUTIFY_WEB_ACCESS_TOKEN");
  const basePath = get(configDir, "AUTIFY_WEB_BASE_PATH");
  const webClient = new WebClient(accessToken, { basePath, userAgent });
  return {
    webClient,
    workspaceId,
  };
};

export default class ConnectClientStart extends Command {
  static description = "[Experimental] Start Autify Connect Client";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    verbose: Flags.boolean({
      description: "Make the operation more talkative.",
      default: false,
    }),
    "file-logging": Flags.boolean({
      description:
        "Logging Autify Connect Client log to a file instead of console.",
      default: false,
    }),
    "web-workspace-id": Flags.integer({
      description:
        "Workspace ID of Autify for Web to create an ephemeral Access Point. If not specified, it will use the one configured by `autify connect access-point set`, instead.",
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(ConnectClientStart);
    const { configDir, cacheDir, userAgent } = this.config;
    const {
      verbose,
      "file-logging": fileLogging,
      "web-workspace-id": webWorkspaceId,
    } = flags;
    const ephemeralAccessPoint = createEphemeralAccessPointIfNeeded(
      configDir,
      userAgent,
      webWorkspaceId
    );

    const { version, logFile, accessPointName, waitReady, waitExit } =
      await spawnClient(configDir, cacheDir, {
        verbose,
        fileLogging,
        ephemeralAccessPoint,
      });
    this.log(
      `Starting Autify Connect Client for Access Point "${accessPointName}" (${version})...`
    );
    if (logFile) this.log(`Log file is located at ${logFile}`);
    this.log("Waiting until Autify Connect Client is ready...");
    await waitReady();
    this.log("Autify Connect Client is ready!");
    const [code, signal, deletedAccessPointName] = await waitExit();
    if (deletedAccessPointName)
      this.log(
        `Autify Connect Access Point was deleted: "${deletedAccessPointName}"`
      );
    this.log(
      `Autify Connect Client exited (code: ${code}, signal: ${signal}).`
    );
    this.exit(code ?? 1);
  }
}
