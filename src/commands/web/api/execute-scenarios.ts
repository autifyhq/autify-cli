import { Command, Flags } from "@oclif/core";
import { getWebClient } from "../../../autify/web/getWebClient";

export default class WebApiExecuteScenarios extends Command {
  static description =
    'You can execute any scenarios in your workspace using any execution environments (which is called "capabilities" here).';

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    "project-id": Flags.integer({
      description:
        "For example, 1 for the following URL: https://app.autify.com/projects/1/scenarios",
      required: true,
    }),
    "execute-scenarios-request": Flags.string({
      description:
        'A JSON object with the scenarios and settings to execute e.g. {"name":"string","execution_type":"parallel","capabilities":[{"os":"string","os_type":"macos","os_version":"string","device":"string","browser":"string","browser_type":"chrome","browser_version":"string"}],"url_replacements":[{"pattern_url":"string","replacement_url":"string"}],"scenarios":[{"id":0}],"autify_connect":{"name":"string"}}',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(WebApiExecuteScenarios);
    const { configDir, userAgent } = this.config;
    const client = getWebClient(configDir, userAgent);
    const res = await client.executeScenarios(
      flags["project-id"],
      JSON.parse(flags["execute-scenarios-request"])
    );
    console.log(JSON.stringify(res.data, null, 2));
  }
}
