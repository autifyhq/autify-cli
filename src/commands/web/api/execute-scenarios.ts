import {Command, Flags} from '@oclif/core'
import {Client} from '../../../generated/web/client'

export default class WebApiExecuteScenarios extends Command {
  static description = 'You can execute any scenarios in your workspace using any execution environments (which is called \"capabilities\" here).'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-id': Flags.integer({description: 'For example, 1 for the following URL: https://app.autify.com/projects/1/scenarios', required: true}),
    'execute-scenarios-request': Flags.string({description: 'The scenarios and settings to execute', required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(WebApiExecuteScenarios)

    const client = new Client(this.config.configDir, this.config.userAgent)
    const res = await client.executeScenarios(flags['project-id'], JSON.parse(flags['execute-scenarios-request']))
    console.log(JSON.stringify(res.data, null, 2))
  }
}
