import { expect, test } from "@oclif/test";

describe("mobile/auth/login", () => {
  test
    .stdout()
    .command(["mobile/auth/login"])
    .it("runs hello", (ctx) => {
      expect(ctx.stdout).to.contain("hello world");
    });

  test
    .stdout()
    .command(["mobile/auth/login", "--name", "jeff"])
    .it("runs hello --name jeff", (ctx) => {
      expect(ctx.stdout).to.contain("hello jeff");
    });
});
