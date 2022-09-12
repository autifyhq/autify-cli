import { expect, test } from "@oclif/test";

describe("connect/access-point/create", () => {
  test
    .stdout()
    .command(["connect/access-point/create"])
    .it("runs hello", (ctx) => {
      expect(ctx.stdout).to.contain("hello world");
    });

  test
    .stdout()
    .command(["connect/access-point/create", "--name", "jeff"])
    .it("runs hello --name jeff", (ctx) => {
      expect(ctx.stdout).to.contain("hello jeff");
    });
});
