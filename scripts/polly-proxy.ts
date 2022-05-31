import express from 'express'
import {createProxyMiddleware} from 'http-proxy-middleware'
import {Polly} from '@pollyjs/core'
import NodeHttpAdapter from '@pollyjs/adapter-node-http'
import FSPersister from '@pollyjs/persister-fs'
import {spawn} from 'node:child_process'
import {AddressInfo} from 'node:net'
import path from 'node:path'

Polly.register(NodeHttpAdapter)
Polly.register(FSPersister)

if (process.argv.length < 4) {
  throw new Error('Usage: ts-node proxy.ts <record|replay> <cwd> autify ...args')
}

const mode = process.argv[2] as 'record' | 'replay'
const cwd = process.argv[3]
const command = process.argv[4]
const args = process.argv.slice(5)

const polly = new Polly('polly-proxy', {
  mode,
  adapters: ['node-http'],
  persister: 'fs',
  persisterOptions: {
    fs: {
      recordingsDir: path.join(cwd, '__recordings__', encodeURIComponent(args.join(' '))),
    },
  },
  recordIfMissing: false,
  flushRequestsOnStop: true,
  matchRequestsBy: {
    headers: false,
  },
})

polly.server.any().on('beforePersist', (_req, recording) => {
  recording.request.headers = []
  recording.response.headers = []
})

const startProxy = (target: string) => {
  const app = express()
  app.use('', createProxyMiddleware({target, changeOrigin: true}))
  const server = app.listen()
  const {port} = server.address() as AddressInfo
  return {server, port}
}

const webProxy = startProxy('https://app.autify.com')
const mobileProxy = startProxy('https://mobile-app.autify.com')

const proc = spawn(command, args, {
  env: {
    ...process.env,
    AUTIFY_WEB_BASE_PATH: `http://localhost:${webProxy.port}/api/v1/`,
    AUTIFY_MOBILE_BASE_PATH: `http://localhost:${mobileProxy.port}/api/v1/`,
  },
  stdio: 'inherit',
  shell: true,
})

proc.on('close', async code => {
  webProxy.server.close()
  mobileProxy.server.close()
  await polly.stop()
  // eslint-disable-next-line no-process-exit, unicorn/no-process-exit
  process.exit(code ?? 0)
})
