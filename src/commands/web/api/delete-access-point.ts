import { Command, Flags } from "@oclif/core";
import { getWebClient } from "../../../autify/web/getWebClient.js";

export default class WebApiDeleteAccessPoint extends Command {
  static description = "You can delete an access point by passing in its name.";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "project-id": Flags.integer({
      description:
        "For example, 1 for the following URL: https://app.autify.com/projects/1/scenarios",
      required: true,
    }),
    "delete-access-point-request": Flags.string({
      description: "The name of the access point to be deleted",
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(WebApiDeleteAccessPoint);
    const { configDir, userAgent } = this.config;
    const client = getWebClient(configDir, userAgent);
    const res = await client.deleteAccessPoint(
      flags["project-id"],
      JSON.parse(flags["delete-access-point-request"])
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
