import {Command, Flags} from '@oclif/core'
import {Client} from '../../../generated/web/client'

export default class WebApiListUrlReplacements extends Command {
  static description = 'List url replacements for the test plan'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'test-plan-id': Flags.integer({description: 'For example, 15 for the following URL: https://app.autify.com/projects/1/test_plans/15', required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(WebApiListUrlReplacements)

    const client = new Client(this.config.configDir, this.config.userAgent)
    const res = await client.listUrlReplacements(flags['test-plan-id'])
    console.log(JSON.stringify(res.data, null, 2))
  }
}
