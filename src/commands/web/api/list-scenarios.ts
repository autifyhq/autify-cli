import {Command, Flags} from '@oclif/core'
import {Client} from '../../../generated/web/client'

export default class WebApiListScenarios extends Command {
  static description = 'List scenarios.'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-id': Flags.integer({description: 'For example, 1 for the following URL: https://app.autify.com/projects/1/scenarios', required: true}),
    'page': Flags.integer({description: 'The number of page returns.', required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(WebApiListScenarios)

    const client = new Client(this.config.configDir, this.config.userAgent)
    const res = await client.listScenarios(flags['project-id'], flags['page'])
    console.log(JSON.stringify(res.data, null, 2))
  }
}
