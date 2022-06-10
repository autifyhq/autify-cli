import { Command, Flags } from "@oclif/core";
import { WebClient as Client } from "@autifyhq/autify-sdk";
import { get, getOrThrow } from "../../../config";

export default class WebApiDescribeResult extends Command {
  static description = "Get a result.";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "project-id": Flags.integer({
      description:
        "For example, 1 for the following URL: https://app.autify.com/projects/1/results/4",
      required: true,
    }),
    "result-id": Flags.integer({
      description:
        "For example, 4 for the following URL: https://app.autify.com/projects/1/results/4",
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(WebApiDescribeResult);
    const { configDir, userAgent } = this.config;
    const accessToken = getOrThrow(configDir, "AUTIFY_WEB_ACCESS_TOKEN");
    const basePath = get(configDir, "AUTIFY_WEB_BASE_PATH");
    const client = new Client(accessToken, { basePath, userAgent });
    const res = await client.describeResult(
      flags["project-id"],
      flags["result-id"]
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
