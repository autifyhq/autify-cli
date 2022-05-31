import * as envfile from 'envfile'
import * as fs from 'node:fs'
import * as path from 'node:path'

type Variable = 'AUTIFY_WEB_ACCESS_TOKEN' | 'AUTIFY_WEB_BASE_PATH' | 'AUTIFY_MOBILE_ACCESS_TOKEN' | 'AUTIFY_MOBILE_BASE_PATH'

const envFile = (dir: string) => path.resolve(dir, 'config.env')
const read = (dir: string) => fs.existsSync(envFile(dir)) ? envfile.parse(fs.readFileSync(envFile(dir)).toString()) : {}
const write = (dir: string, config: envfile.Data) => fs.writeFileSync(envFile(dir), envfile.stringify(config))

export const set = (configDir: string, key: Variable, value: string | undefined): void => {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, {recursive: true})
  }

  const config = read(configDir)
  if (value) {
    config[key] = value
  } else {
    delete config[key]
  }

  write(configDir, config)
}

export const get = (configDir: string, key: Variable): string | undefined => {
  return key in process.env ? process.env[key] : read(configDir)[key]
}

export const getOrThrow = (configDir: string, key: Variable): string => {
  const value = get(configDir, key)
  if (!value) {
    throw new Error(`Config for ${key} is not found.`)
  }

  return value
}
