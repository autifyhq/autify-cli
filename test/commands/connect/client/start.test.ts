import { expect, test } from "@oclif/test";

describe("connect/client/start", () => {
  test
    .stdout()
    .command(["connect/client/start"])
    .it("runs hello", (ctx) => {
      expect(ctx.stdout).to.contain("hello world");
    });

  test
    .stdout()
    .command(["connect/client/start", "--name", "jeff"])
    .it("runs hello --name jeff", (ctx) => {
      expect(ctx.stdout).to.contain("hello jeff");
    });
});
