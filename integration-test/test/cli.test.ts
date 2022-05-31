import {execAutifyCli} from '../helpers/execAutifyCli'
import chai, {expect} from 'chai'
import {jestSnapshotPlugin} from 'mocha-chai-jest-snapshot'

chai.use(jestSnapshotPlugin())

const commands = [
  'web test run https://app.autify.com/projects/743/scenarios/91437',
  'web test run https://app.autify.com/projects/743/scenarios/91437 --wait',
]

describe('autify-cli', function () {
  for (const command of commands) {
    it(command, async function () {
      this.timeout(300_000)
      expect(await execAutifyCli(command)).toMatchSnapshot()
    })
  }
})
