import { expect, test } from "@oclif/test";

describe("connect/access-point/set", () => {
  test
    .stdout()
    .command(["connect/access-point/set"])
    .it("runs hello", (ctx) => {
      expect(ctx.stdout).to.contain("hello world");
    });

  test
    .stdout()
    .command(["connect/access-point/set", "--name", "jeff"])
    .it("runs hello --name jeff", (ctx) => {
      expect(ctx.stdout).to.contain("hello jeff");
    });
});
