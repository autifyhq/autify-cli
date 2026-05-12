import { spawn } from "node:child_process";
import { env } from "node:process";

type Interaction =
  | {
      type: "expect";
      regex: RegExp;
    }
  | {
      type: "question";
      regex: RegExp;
      answer: string;
    };

export const interactWithProcess = async (
  binaryPath: string,
  argv: string[],
  interactions: Interaction[],
  extraEnv: { [key: string]: string } = {}
): Promise<void> => {
  const child = spawn(binaryPath, argv, {
    env: {
      ...env,
      ...extraEnv,
    },
  });

  const interactionWithResults = interactions.map((interaction) => ({
    ...interaction,
    result: false,
  }));

  for await (const interaction of interactionWithResults) {
    let text = "";
    for await (const data of child.stdout.iterator({
      destroyOnReturn: false,
    })) {
      process.stdout.write(data);
      text += data.toString();
      if (interaction.regex.test(text)) {
        if (interaction.type === "question") {
          child.stdin.write(interaction.answer);
        }

        interaction.result = true;
        break;
      }
    }
  }

  for (const interaction of interactionWithResults) {
    if (!interaction.result) {
      throw new Error(`Didn't get expected output: ${interaction.regex}`);
    }
  }
};
