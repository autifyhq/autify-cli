import { Command, Flags } from "@oclif/core";
import { MobileClient as Client } from "@autifyhq/autify-sdk";
import { get, getOrThrow } from "../../../config";

export default class MobileApiListTestResults extends Command {
  static description = "List test results.";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "project-id": Flags.string({
      description:
        "ID of the project from which the list of test results will be retrieved.",
      required: true,
    }),
    page: Flags.integer({
      description: "Page number to be retrieved.",
      required: false,
    }),
    "per-page": Flags.integer({
      description: "Number of test results per page.",
      required: false,
    }),
    "test-plan-id": Flags.string({
      description: "ID of the test plan.",
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(MobileApiListTestResults);
    const { configDir, userAgent } = this.config;
    const accessToken = getOrThrow(configDir, "AUTIFY_MOBILE_ACCESS_TOKEN");
    const basePath = get(configDir, "AUTIFY_MOBILE_BASE_PATH");
    const client = new Client(accessToken, { basePath, userAgent });
    const res = await client.listTestResults(
      flags["project-id"],
      flags.page,
      flags["per-page"],
      flags["test-plan-id"]
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
