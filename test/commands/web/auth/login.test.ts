import { expect, test } from "@oclif/test";

describe("web/auth/login", () => {
  test
    .stdout()
    .command(["web/auth/login"])
    .it("runs hello", (ctx) => {
      expect(ctx.stdout).to.contain("hello world");
    });

  test
    .stdout()
    .command(["web/auth/login", "--name", "jeff"])
    .it("runs hello --name jeff", (ctx) => {
      expect(ctx.stdout).to.contain("hello jeff");
    });
});
