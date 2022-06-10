import { MethodDeclaration, Project, SourceFile } from "ts-morph";

const project = new Project({});

const getFlagType = (parameterType: string) => {
  switch (parameterType) {
    case "number":
      return "Flags.integer";
    default:
      return "Flags.string";
  }
};

const pascallize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
const kebabize = (str: string) =>
  str.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    (c, ofs) => (ofs ? "-" : "") + c.toLowerCase()
  );

const writeCommandSource = (service: string, apiMethod: MethodDeclaration) => {
  const commandClassName =
    pascallize(service) + "Api" + pascallize(apiMethod.getName());
  const jsDoc = apiMethod.getJsDocs()[0];
  const description = jsDoc.getDescription();
  const parameters = apiMethod.getParameters().slice(0, -1);
  const flags: string[] = [];
  const args: string[] = [];
  for (const [index, parameter] of parameters.entries()) {
    const name = kebabize(parameter.getName());
    const parameterType = parameter.getType().getText();
    const required = !parameter.isOptional();
    const flagDescription = jsDoc
      .getTags()
      .filter((t) => t.getTagName() === "param")
      [index].getCommentText();
    const flagType = getFlagType(parameterType);
    flags.push(
      `    '${name}': ${flagType}({description: '${flagDescription}', required: ${required}}),`
    );
    const arg = `flags['${name}']`;
    if (
      parameterType !== "number" &&
      parameterType !== "string" &&
      parameterType !== "any"
    ) {
      args.push(`JSON.parse(${arg})`);
    } else {
      args.push(arg);
    }
  }

  const flagsString = flags.join("\n");
  const argsString = args.join(", ");
  const clientClass = `${pascallize(service)}Client`;
  project
    .createSourceFile(
      `./src/commands/${service}/api/${kebabize(apiMethod.getName())}.ts`,
      (writer) => {
        writer
          .write(
            `
import {Command, Flags} from '@oclif/core'
import {${clientClass} as Client} from '@autifyhq/autify-sdk'
import {get, getOrThrow} from '../../../config'

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
    const {configDir, userAgent} = this.config
    const accessToken = getOrThrow(configDir, 'AUTIFY_${service.toUpperCase()}_ACCESS_TOKEN')
    const basePath = get(configDir, 'AUTIFY_${service.toUpperCase()}_BASE_PATH')
    const client = new Client(accessToken, {basePath, userAgent})
    const res = await client.${apiMethod.getName()}(${argsString})
    console.log(JSON.stringify(res.data, null, 2))
  }
}
  `.trim()
          )
          .newLine();
      },
      {
        overwrite: true,
      }
    )
    .saveSync();
};

let clientSource: SourceFile;

const main = () => {
  const service = process.argv[2];
  if (!service) throw new Error("Service not specified.");

  clientSource = project.addSourceFileAtPath(
    `../../node_modules/@autifyhq/autify-sdk/dist/generated/${service}/client.d.ts`
  );
  const clientClass = clientSource.getClassOrThrow("Client");
  for (const apiMethod of clientClass.getMethods()) {
    writeCommandSource(service, apiMethod);
  }
};

main();
