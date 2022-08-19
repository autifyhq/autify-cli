import { expect, test } from "@oclif/test";

describe("mobile/build/upload", () => {
  test
    .stdout()
    .command(["mobile/build/upload"])
    .it("runs hello", (ctx) => {
      expect(ctx.stdout).to.contain("hello world");
    });

  test
    .stdout()
    .command(["mobile/build/upload", "--name", "jeff"])
    .it("runs hello --name jeff", (ctx) => {
      expect(ctx.stdout).to.contain("hello jeff");
    });
});
