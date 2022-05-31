import {Command, Flags} from '@oclif/core'
import {Client} from '../../../generated/web/client'

export default class WebApiDeleteUrlReplacement extends Command {
  static description = 'Delete a url replacement for the test plan'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'test-plan-id': Flags.integer({description: 'For example, 15 for the following URL: https://app.autify.com/projects/1/test_plans/15', required: true}),
    'url-replacement-id': Flags.integer({description: 'url_replacement id', required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(WebApiDeleteUrlReplacement)

    const client = new Client(this.config.configDir, this.config.userAgent)
    const res = await client.deleteUrlReplacement(flags['test-plan-id'], flags['url-replacement-id'])
    console.log(JSON.stringify(res.data, null, 2))
  }
}
