import { expect, test } from "@oclif/test";

describe("connect/client/install", () => {
  test
    .stdout()
    .command(["connect/client/install"])
    .it("runs hello", (ctx) => {
      expect(ctx.stdout).to.contain("hello world");
    });

  test
    .stdout()
    .command(["connect/client/install", "--name", "jeff"])
    .it("runs hello --name jeff", (ctx) => {
      expect(ctx.stdout).to.contain("hello jeff");
    });
});
