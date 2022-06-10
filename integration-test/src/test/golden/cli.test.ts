import { execAutifyCli } from "../helpers/execAutifyCli";

const commands = [
  "web test run https://app.autify.com/projects/743/scenarios/91437",
  "web test run https://app.autify.com/projects/743/scenarios/91437 --wait",
];

describe("autify-cli", () => {
  test.each(commands)(
    "autify %s",
    async (command) => {
      expect(await execAutifyCli(command)).toMatchSnapshot();
    },
    300_000
  );
});
