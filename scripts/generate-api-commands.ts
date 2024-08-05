import { MethodDeclaration, Project, SourceFile } from "ts-morph";

const project = new Project({});

const getFlagType = (parameterType: string) => {
  switch (parameterType) {
    case "number": {
      return "Flags.integer";
    }

    default: {
      return "Flags.string";
    }
  }
};

const pascallize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
const kebabize = (str: string) =>
  str.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    (c, ofs) => (ofs ? "-" : "") + c.toLowerCase()
  );

const writeCommandSource = (service: string, apiMethod: MethodDeclaration) => {
  const Service = pascallize(service);
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
      `    '${name}': ${flagType}({description: ${JSON.stringify(flagDescription)}, required: ${required}}),`
    );
    const arg = `flags['${name}']`;
    if (
      parameterType !== "number" &&
      parameterType !== "string" &&
      parameterType !== "any"
    ) {
      if (required) args.push(`JSON.parse(${arg})`);
      else args.push(`${arg} ? JSON.parse(${arg}) : undefined`);
    } else {
      args.push(arg);
    }
  }

  const flagsString = flags.join("\n");
  const argsString = args.join(", ");
  project
    .createSourceFile(
      `./src/commands/${service}/api/${kebabize(apiMethod.getName())}.ts`,
      (writer) => {
        writer
          .write(
            `
import {Command, Flags} from '@oclif/core'
import {get${Service}Client} from '../../../autify/${service}/get${Service}Client'

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
    const client = get${Service}Client(configDir, userAgent);
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
    `node_modules/@autifyhq/autify-sdk/dist/generated/${service}/client.d.ts`
  );
  const clientClassName = pascallize(service) + "Client";
  const clientClass = clientSource.getClassOrThrow(clientClassName);
  for (const apiMethod of clientClass.getMethods()) {
    writeCommandSource(service, apiMethod);
  }
};

main();
