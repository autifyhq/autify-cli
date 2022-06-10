import { expect, test } from "@oclif/test";

describe("web/test/run", () => {
  test
    .stdout()
    .command(["web/test/run"])
    .it("runs hello", (ctx) => {
      expect(ctx.stdout).to.contain("hello world");
    });

  test
    .stdout()
    .command(["web/test/run", "--name", "jeff"])
    .it("runs hello --name jeff", (ctx) => {
      expect(ctx.stdout).to.contain("hello jeff");
    });
});
