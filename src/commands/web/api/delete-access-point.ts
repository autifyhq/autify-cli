import { Command, Flags } from "@oclif/core";
import { WebClient as Client } from "@autifyhq/autify-sdk";
import { get, getOrThrow } from "../../../config";

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
    const accessToken = getOrThrow(configDir, "AUTIFY_WEB_ACCESS_TOKEN");
    const basePath = get(configDir, "AUTIFY_WEB_BASE_PATH");
    const client = new Client(accessToken, { basePath, userAgent });
    const res = await client.deleteAccessPoint(
      flags["project-id"],
      JSON.parse(flags["delete-access-point-request"])
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
