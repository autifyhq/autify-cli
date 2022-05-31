import {Command, Flags} from '@oclif/core'
import {Client} from '../../../generated/web/client'

export default class WebApiExecuteSchedule extends Command {
  static description = 'Run a test plan. (Note: \"Schedule\" is called as \"TestPlan\" now.)'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'schedule-id': Flags.integer({description: 'For example, 3 for the following URL: https://app.autify.com/projects/1/test_plans/3', required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(WebApiExecuteSchedule)

    const client = new Client(this.config.configDir, this.config.userAgent)
    const res = await client.executeSchedule(flags['schedule-id'])
    console.log(JSON.stringify(res.data, null, 2))
  }
}
