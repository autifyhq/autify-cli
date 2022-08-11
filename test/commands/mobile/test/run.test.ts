import { expect, test } from "@oclif/test";

describe("mobile/test/run", () => {
  test
    .stdout()
    .command(["mobile/test/run"])
    .it("runs hello", (ctx) => {
      expect(ctx.stdout).to.contain("hello world");
    });

  test
    .stdout()
    .command(["mobile/test/run", "--name", "jeff"])
    .it("runs hello --name jeff", (ctx) => {
      expect(ctx.stdout).to.contain("hello jeff");
    });
});
