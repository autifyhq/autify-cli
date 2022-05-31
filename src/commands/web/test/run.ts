import {Command, Flags} from '@oclif/core'
import emoji from 'node-emoji'
import {Client} from '../../../generated/web/client'
import {runTest} from '../../../autify/web/runTest'
import {getWebTestResultUrl} from '../../../autify/web/getTestResultUrl'
import WebTestWait from './wait'

const parseUrlReplacements = (urlReplacements: string[]) => {
  return urlReplacements.map(s => {
    // eslint-disable-next-line camelcase
    const [pattern_url, replacement_url] = s.split('=')
    // eslint-disable-next-line camelcase
    return {pattern_url, replacement_url}
  })
}

// eslint-disable-next-line camelcase
const urlReplacementsToString = (urlReplacements: {pattern_url: string, replacement_url: string}[]) => {
  return urlReplacements.map(urlReplacement => {
    return `${urlReplacement.pattern_url} => ${urlReplacement.replacement_url}`
  })
  .join(', ')
}

export default class WebTestRun extends Command {
  static description = 'Run a scenario or test plan.'

  static examples = [
    'Run a test scenario (Default capability):\n<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/scenarios/0000',
    'Run a test plan:\n<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/test_plans/0000',
    'Run and wait a test scenario:\n<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/scenarios/0000 --wait --timeout 600',
    'Run a test scenario with a specific capability:\n<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/scenarios/0000 --os "Windows Server" --browser Edge',
    'With URL replacements:\n<%= config.bin %> <%= command.id %> https://app.autify.com/projects/0000/scenarios/0000 -r http://example.com=http://example.net -r http://example.org=http://example.net',
  ]

  static flags = {
    'url-replacements': Flags.string({char: 'r', description: 'URL replacements. Example: http://example.com=http://example.net', multiple: true}),
    os: Flags.string({description: 'OS to run the test'}),
    'os-version': Flags.string({description: 'OS version to run the test'}),
    browser: Flags.string({description: 'Browser to run the test'}),
    device: Flags.string({description: 'Device to run the test'}),
    'device-type': Flags.string({description: 'Device type to run the test'}),
    wait: Flags.boolean({char: 'w', description: 'Wait until the test finishes.', default: false}),
    timeout: Flags.integer({char: 't', description: 'Timeout seconds when waiting for the finish of the test execution.', default: 300}),
    verbose: Flags.boolean({char: 'v', description: 'Verbose output', default: false}),
  }

  static args = [
    {name: 'scenario-or-test-plan-url', description: 'Scenario URL or Test plan URL e.g. https://app.autify.com/projects/<ID>/(scenarios|test_plans)/<ID>', required: true},
  ]

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(WebTestRun)
    const capabilityOption = {
      os: flags.os,
      // eslint-disable-next-line camelcase
      os_version: flags['os-version'],
      browser: flags.browser,
      device: flags.device,
      // eslint-disable-next-line camelcase
      device_type: flags['device-type'],
    }
    const urlReplacements = parseUrlReplacements(flags['url-replacements'] ?? [])
    if (urlReplacements.length > 0) this.log(`${emoji.get('memo')} Using URL replacements: ${urlReplacementsToString(urlReplacements)}`)
    const client = new Client(this.config.configDir, this.config.userAgent)
    const {workspaceId, resultId, capability} = await runTest(client, args['scenario-or-test-plan-url'], capabilityOption, urlReplacements)
    const testResultUrl = getWebTestResultUrl(this.config.configDir, workspaceId, resultId)
    this.log(`${emoji.get('white_check_mark')} Successfully started: ${testResultUrl} (Capability is ${capability})`)
    if (flags.wait) {
      const waitArgs = ['--timeout', flags.timeout.toString(), testResultUrl]
      if (flags.verbose) waitArgs.push('--verbose')
      await WebTestWait.run(waitArgs)
    } else {
      this.log('To wait for the test result, run the command below:')
      this.log(`${emoji.get('computer')} $ autify web test wait ${testResultUrl}`)
    }
  }
}
