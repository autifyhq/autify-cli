import { expect, test } from "@oclif/test";

describe("mobile/test/wait", () => {
  test
    .stdout()
    .command(["mobile/test/wait"])
    .it("runs hello", (ctx) => {
      expect(ctx.stdout).to.contain("hello world");
    });

  test
    .stdout()
    .command(["mobile/test/wait", "--name", "jeff"])
    .it("runs hello --name jeff", (ctx) => {
      expect(ctx.stdout).to.contain("hello jeff");
    });
});
