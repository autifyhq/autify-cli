import { expect, test } from "@oclif/test";

describe("web/test/wait", () => {
  test
    .stdout()
    .command(["web/test/wait"])
    .it("runs hello", (ctx) => {
      expect(ctx.stdout).to.contain("hello world");
    });

  test
    .stdout()
    .command(["web/test/wait", "--name", "jeff"])
    .it("runs hello --name jeff", (ctx) => {
      expect(ctx.stdout).to.contain("hello jeff");
    });
});
