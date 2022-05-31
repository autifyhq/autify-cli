/* eslint-disable unicorn/filename-case */

import {promisify} from 'node:util'
import {exec} from 'node:child_process'
import {existsSync} from 'node:fs'
import which from 'which'

const mode = (process.env.AUTIFY_CLI_PROXY_MODE ?? 'replay') as 'record' | 'replay'
if (!mode || !['record', 'replay'].includes(mode)) throw new Error(`Invalid mode for polly-proxy: ${mode}`)

const autify = process.env.AUTIFY_CLI_PATH ?? 'autify'
if (!autify || (!existsSync(autify) && !which.sync(autify))) throw new Error(`Invalid autify path: ${autify}`)

export const execAutifyCli = async (args: string): Promise<{ stdout: string; stderr: string }> => {
  const command = `npm run -s polly-proxy -- ${mode} integration-test/test ${autify} ${args}`
  const {stdout, stderr} = await promisify(exec)(command)
  return {
    stdout: stdout.replace(/\d{2}:\d{2}:\d{2}/g, 'HH:MM:SS'),
    stderr,
  }
}
