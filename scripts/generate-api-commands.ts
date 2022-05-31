import {existsSync, unlinkSync} from 'node:fs'
import {ClassDeclaration, MethodDeclaration, Project, SourceFile} from 'ts-morph'

const project = new Project({})

const getFlagType = (parameterType: string) => {
  switch (parameterType) {
  case 'number':
    return 'Flags.integer'
  default:
    return 'Flags.string'
  }
}

const camelize = (str: string) => str.charAt(0).toLowerCase() + str.slice(1)
const pascallize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
const kebabize = (str: string) => str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, (c, ofs) => (ofs ? '-' : '') + c.toLowerCase())

const writeCommandSource = (service: string, apiClass: ClassDeclaration, apiMethod: MethodDeclaration) => {
  const commandClassName = pascallize(service) + 'Api' + pascallize(apiMethod.getName())
  const jsDoc = apiMethod.getJsDocs()[0]
  const description = jsDoc.getDescription()
  const parameters = apiMethod.getParameters().slice(0, -1)
  const flags: string[] = []
  const args: string[] = []
  for (const [index, parameter] of parameters.entries()) {
    const name = kebabize(parameter.getName())
    const parameterType = parameter.getType().getText()
    const required = !parameter.isOptional()
    const flagDescription = jsDoc.getTags().filter(t => t.getTagName() === 'param')[index].getCommentText()
    const flagType = getFlagType(parameterType)
    flags.push(`    '${name}': ${flagType}({description: '${flagDescription}', required: ${required}}),`)
    const arg = `flags['${name}']`
    if (parameterType !== 'number' && parameterType !== 'string' && parameterType !== 'any') {
      args.push(`JSON.parse(${arg})`)
    } else {
      args.push(arg)
    }
  }

  const flagsString = flags.join('\n')
  const argsString = args.join(', ')
  project.createSourceFile(`./src/commands/${service}/api/${kebabize(apiMethod.getName())}.ts`, writer => {
    writer.write(`
import {Command, Flags} from '@oclif/core'
import {Client} from '../../../generated/${service}/client'

export default class ${commandClassName} extends Command {
  static description = '${description.trim()}'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
${flagsString}
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(${commandClassName})

    const client = new Client(this.config.configDir, this.config.userAgent)
    const res = await client.${apiMethod.getName()}(${argsString})
    console.log(JSON.stringify(res.data, null, 2))
  }
}
  `.trim()).newLine()
  }, {
    overwrite: true,
  }).saveSync()
}

const writeClientSource = (service: string, apiClass: ClassDeclaration, apiMethod: MethodDeclaration) => {
  const clientSource = project.getSourceFile(`./src/generated/${service}/client.ts`) ?? project.createSourceFile(`./src/generated/${service}/client.ts`, `
import {AxiosRequestConfig} from 'axios'
import {get, getOrThrow} from '../../config'
import '../../debug'
import FormData from 'form-data'
import {readFileSync} from 'fs';

class CustomFormData extends FormData {
    append(key: string, filename: any) {
        const blob = readFileSync(filename)
        super.append(key, blob, {filename})
    }
}

export class Client {
    constructor(configDir: string, userAgent: string) {
        const accessToken = getOrThrow(configDir, 'AUTIFY_${service.toUpperCase()}_ACCESS_TOKEN')
        const basePath = get(configDir, 'AUTIFY_${service.toUpperCase()}_BASE_PATH')
        const baseOptions = {
            headers: {
                'User-Agent': userAgent,
            }
        }
        const configuration = new Configuration({accessToken, basePath, formDataCtor: CustomFormData, baseOptions})
    }
}
`.trim(), {overwrite: true})
  if (!clientSource.getImportDeclaration('./openapi')) {
    const namedImports: string[] = ['Configuration']
    for (const [name] of apiSource.getExportedDeclarations()) {
      namedImports.push(name)
    }

    clientSource.addImportDeclaration({
      namedImports,
      moduleSpecifier: './openapi',
    })
  }

  const clientClass = clientSource.getClassOrThrow('Client')
  const apiClassProperty = camelize(apiClass.getName()!)
  if (!clientClass.getProperty(apiClassProperty)) {
    clientClass.addProperty({
      name: apiClassProperty,
      isReadonly: true,
    }).toggleModifier('private', true)
    clientClass.getConstructors()[0].addStatements(`this.${apiClassProperty} = new ${apiClass.getName()}(configuration)`)
  }

  const parameters = apiMethod.getParameters()
  clientClass.addMethod({
    name: apiMethod.getName(),
    parameters: parameters.map(p => p.getStructure()),
    docs: apiMethod.getJsDocs().map(d => d.getStructure()),
    statements: `return this.${apiClassProperty}.${apiMethod.getName()}(${parameters.map(p => p.getName()).join(', ')})`,
  })
  clientSource.saveSync()
}

let apiSource: SourceFile

const main = () => {
  const service = process.argv[2]
  if (!service) throw new Error('Service not specified.')
  if (existsSync(`./src/generated/${service}/client.ts`)) unlinkSync(`./src/generated/${service}/client.ts`)

  apiSource = project.addSourceFileAtPath(`./src/generated/${service}/openapi/api.ts`)
  for (const apiClass of apiSource.getClasses()) {
    for (const apiMethod of apiClass.getMethods()) {
      writeCommandSource(service, apiClass, apiMethod)
      writeClientSource(service, apiClass, apiMethod)
    }
  }
}

main()
