import { Command, Flags } from "@oclif/core";

import {
  confirmOverwriteAccessPoint,
  saveAccessPoint,
} from "../../../autify/connect/accessPointConfig";
import { getWebClient } from "../../../autify/web/getWebClient";

export default class ConnectAccessPointCreate extends Command {
  static args = {};

  static description = "Create an Autify Connect Access Point";

  static examples = [
    "<%= config.bin %> <%= command.id %> --name NAME --web-workspace-id ID",
  ];

  static flags = {
    name: Flags.string({
      description: "Name of Autify Connect Access Point to be created",
      required: true,
    }),
    "web-workspace-id": Flags.integer({
      description:
        "Workspace ID of Autify for Web to which the Access Point will belong",
      exactlyOne: ["web-workspace-id"],
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(ConnectAccessPointCreate);
    const { configDir, userAgent } = this.config;
    await confirmOverwriteAccessPoint(configDir);
    const { name, "web-workspace-id": webWorkspaceId } = flags;
    if (webWorkspaceId) {
      const client = getWebClient(configDir, userAgent);
      const response = await client.createAccessPoint(webWorkspaceId, {
        name,
      });
      const { key } = response.data;
      this.log(
        `Successfully created Access Point: (name: ${name}, web-workspace-id: ${webWorkspaceId})`
      );
      this.log(saveAccessPoint(configDir, name, key));
    }
  }
}
