import assert from "node:assert";
import { execSync } from "node:child_process";
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
  mkdtempSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import pkg from "../package.json";

// oclif pack reads the lockfile from the package root, but in this monorepo
// the canonical lockfile lives at the workspace root one directory up.
if (!existsSync("package-lock.json") && existsSync("../package-lock.json")) {
  copyFileSync("../package-lock.json", "package-lock.json");
}

const { version, oclif: oclifConfig } = pkg;

const { bucket, folder } = oclifConfig.update.s3;

const run = (cmd: string, cwd?: string) => {
  execSync(cmd, { stdio: "inherit", cwd });
};

const oclif = (args: string) => {
  const cmd = `oclif ${args}`;
  console.log(`Executing: ${cmd}`);
  run(cmd);
};

const fail = (message: string) => {
  console.error(message);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
};

const channel = "stable";

const assertStableVersion = () => {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(
      `Invalid version: ${version} (expected stable semver like X.Y.Z)`
    );
  }
};

const sha = execSync("git rev-parse --short HEAD").toString().trim();

type S3FileOption = Readonly<{
  target: string;
  tarball?: "tar.gz" | "tar.xz";
  npm?: "autify-cli" | "autify-cli-integration-test";
  script?: "install-standalone.sh" | "install-cicd.bash";
}>;

const s3File = ({ target, tarball, npm, script }: S3FileOption) => {
  let file = `autify-v${version}-${sha}-`;
  switch (target) {
    case "macos": {
      file += "x64.pkg";
      break;
    }

    case "npm": {
      assert(npm);
      file = `autifyhq-${npm}-${version}.tgz`;
      break;
    }

    case "shell": {
      assert(script);
      file = script;
      break;
    }

    case "win": {
      file += "x64.exe";
      break;
    }

    default: {
      assert(tarball);
      file += `${target}.${tarball}`;
    }
  }

  return file;
};

const s3KeyPrefix = `${folder}/versions/${version}/${sha}`;

const uploadNpmPackage = (
  npm: "autify-cli" | "autify-cli-integration-test"
) => {
  if (npm === "autify-cli") run("npm pack");
  else if (npm === "autify-cli-integration-test")
    run("npm pack -w integration-test --pack-destination=autify-cli", "..");
  const file = s3File({ target: "npm", npm });
  run(
    `aws s3 cp --acl public-read ${file} s3://${bucket}/${s3KeyPrefix}/${file}`
  );
};

const uploadShell = (script: "install-standalone.sh" | "install-cicd.bash") => {
  const prefix = `${folder}/versions/${version}/${sha}/autify-v${version}-${sha}`;
  updateShellInstaller(script, prefix);
  const file = s3File({ target: "shell", script });
  run(
    `aws s3 cp --acl public-read ${file} s3://${bucket}/${s3KeyPrefix}/${file}`
  );
};

const uploadCommand = (args: string[]) => {
  const target = args[0];
  if (!target) fail("Usage: ts-node ./scripts/release.ts upload TARGET");
  switch (target) {
    case "deb": {
      oclif("pack deb");
      oclif("upload deb");
      break;
    }

    case "macos": {
      oclif("pack macos");
      oclif("upload macos");
      break;
    }

    case "npm": {
      uploadNpmPackage("autify-cli");
      uploadNpmPackage("autify-cli-integration-test");
      break;
    }

    case "shell": {
      uploadShell("install-standalone.sh");
      uploadShell("install-cicd.bash");
      break;
    }

    case "win": {
      oclif("pack win");
      oclif("upload win");
      break;
    }

    default: {
      oclif(`pack tarballs -t ${target}`);
      oclif(`upload tarballs -t ${target}`);
    }
  }
};

const updateShellInstaller = (file: string, prefix: string, cwd?: string) => {
  const content = readFileSync(file)
    .toString()
    .replace("AUTIFY_CLI_VERSION=REPLACE", `AUTIFY_CLI_VERSION="${version}"`)
    .replace("AUTIFY_S3_BUCKET=REPLACE", `AUTIFY_S3_BUCKET="${bucket}"`)
    .replace("AUTIFY_S3_PREFIX=REPLACE", `AUTIFY_S3_PREFIX="${prefix}"`);
  writeFileSync(cwd ? join(cwd, file) : file, content);
};

const updateBrewFormula = (file: string) => {
  const content = readFileSync(file)
    .toString()
    .replace("<REVISION>", sha)
    .replace("<VERSION>", version);
  writeFileSync(file, content);
};

const promoteShellInstaller = (file: string, channel: string) => {
  const prefix = `${folder}/channels/${channel}/autify`;
  updateShellInstaller(file, prefix);
  const dest = `s3://${bucket}/${folder}/channels/${channel}/${file}`;
  console.log(`Promoting shell installer to ${dest}`);
  run(`aws s3 cp ${file} ${dest} --acl public-read`);
};

const promoteNpm = (
  npm: "autify-cli" | "autify-cli-integration-test",
  channel: string
) => {
  const file = downloadS3(".", { target: "npm", npm });
  const regex = new RegExp(`${npm}-.+\\.tgz$`);
  const destFile = file.replace(regex, `${npm}.tgz`);
  const dest = `s3://${bucket}/${folder}/channels/${channel}/${destFile}`;
  console.log(`Promoting npm package to ${dest}`);
  run(`aws s3 cp ${file} ${dest} --acl public-read`);
};

const promoteS3 = () => {
  const targets =
    "darwin-arm64,darwin-x64,linux-arm,linux-arm64,linux-x64,win32-x86,win32-x64";
  oclif(
    `promote --channel ${channel} --version ${version} --sha ${sha} --indexes --targets ${targets} --win --macos --xz`
  );
  promoteShellInstaller("install-standalone.sh", channel);
  promoteShellInstaller("install-cicd.bash", channel);
  promoteNpm("autify-cli", channel);
  promoteNpm("autify-cli-integration-test", channel);
};

const publishBrew = () => {
  updateBrewFormula("autify-cli.rb");
  run("cp autify-cli.rb ./homebrew-tap/Formula/");
  run(
    `git add . && git commit -m "[autify-cli] Release ${version}"`,
    "./homebrew-tap"
  );
  run("git push", "./homebrew-tap");
};

const publishNpm = () => {
  const cliPackage = downloadS3(".", { target: "npm", npm: "autify-cli" });
  const testPackage = downloadS3(".", {
    target: "npm",
    npm: "autify-cli-integration-test",
  });
  run(`npm publish --access=public ${cliPackage}`);
  run(`npm publish --access=public ${testPackage}`);
};

const publishCommand = () => {
  assertStableVersion();
  const tag = execSync("git tag --points-at HEAD").toString();
  if (tag === "") throw new Error("Publish only supports a tagged commit.");
  promoteS3();
  publishBrew();
  publishNpm();
};

const rollbackCommand = () => {
  assertStableVersion();
  const tag = execSync("git tag --points-at HEAD").toString();
  if (tag === "") throw new Error("Rollback only supports a tagged commit.");
  promoteS3();
  publishBrew();
};

const downloadS3 = (
  cwd: string,
  { target, tarball, npm, script }: S3FileOption
) => {
  const file = s3File({ target, tarball, npm, script });
  const key = `${s3KeyPrefix}/${file}`;
  const url = `https://${bucket}.s3.amazonaws.com/${key}`;
  run(`curl -s -O ${url}`, cwd);
  return file;
};

const installTarball = (
  cwd: string,
  target: string,
  tarball: "tar.gz" | "tar.xz"
) => {
  const file = downloadS3(cwd, { target, tarball });
  const tarFlag = tarball === "tar.xz" ? "-xJf" : "-xzf";
  run(`tar ${tarFlag} ${file}`, cwd);
  return join(cwd, "autify", "bin");
};

const installWindows = (cwd: string) => {
  const file = downloadS3(cwd, { target: "win" });
  run(`${file} /S /D=${homedir()}`, cwd);
  return join(homedir(), "bin");
};

const installMacos = (cwd: string) => {
  const file = downloadS3(cwd, { target: "macos" });
  run(
    `installer -pkg ${file} -target CurrentUserHomeDirectory -verboseR -dumplog`,
    cwd
  );
  return join(homedir(), "usr/local/lib/autify/bin");
};

const installStandaloneShell = (cwd: string) => {
  const file = downloadS3(cwd, {
    target: "shell",
    script: "install-standalone.sh",
  });
  run(`cat ${file} | sh -xe`, cwd);
};

const installCicdShell = (cwd: string) => {
  const file = downloadS3(cwd, {
    target: "shell",
    script: "install-cicd.bash",
  });
  run(`cat ${file} | bash -xe`, cwd);
  const autifyPath = join(cwd, "autify", "path");
  return readFileSync(autifyPath).toString();
};

const installBrew = () => {
  const tap = execSync("brew --repo autifyhq/tap").toString().trim();
  run(`mkdir -p ${tap}/Formula`);
  updateBrewFormula("autify-cli.rb");
  run(`cp autify-cli.rb ${tap}/Formula/`);
  run("brew install -v -d autify-cli");
};

const installNpm = (cwd: string) => {
  const cliPackage = downloadS3(cwd, { target: "npm", npm: "autify-cli" });
  const testPackage = downloadS3(cwd, {
    target: "npm",
    npm: "autify-cli-integration-test",
  });
  run(`npm install ${cliPackage} ${testPackage}`, cwd);
  return join(cwd, "node_modules", ".bin");
};

const installCommand = (args: string[]) => {
  const target = args[0];
  if (!target) fail("Usage: ts-node ./scripts/release.ts install TARGET");
  const temp = mkdtempSync(join(tmpdir(), "autify-cli-"));
  let bin: string | void;
  switch (target) {
    case "brew": {
      bin = installBrew();
      break;
    }

    case "cicd-shell": {
      bin = installCicdShell(temp);
      break;
    }

    case "macos": {
      bin = installMacos(temp);
      break;
    }

    case "npm": {
      bin = installNpm(temp);
      break;
    }

    case "standalone-shell": {
      bin = installStandaloneShell(temp);
      break;
    }

    case "win": {
      bin = installWindows(temp);
      break;
    }

    default: {
      const tarball = "tar.xz";
      bin = installTarball(temp, target, tarball);
    }
  }

  if (process.env.GITHUB_PATH && bin) {
    console.log(`Adding ${bin} to PATH`);
    appendFileSync(process.env.GITHUB_PATH, bin);
  }
};

const setOutput = (name: string, value: string) => {
  if (!process.env.GITHUB_OUTPUT) throw new Error("GITHUB_OUTPUT is empty");
  writeFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}`, { flag: "a" });
};

const getInstallerUrlCommand = () => {
  const url = `https://${bucket}.s3.amazonaws.com/${s3KeyPrefix}/install-cicd.bash`;
  setOutput("installer-url", url);
};

const main = () => {
  if (process.argv.length < 3) {
    fail("Usage: ts-node ./scripts/release.ts COMMAND ARGS");
  }

  const command = process.argv[2];
  const args = process.argv.slice(3);
  switch (command) {
    case "get-installer-url": {
      getInstallerUrlCommand();
      break;
    }

    case "install": {
      installCommand(args);
      break;
    }

    case "publish": {
      publishCommand();
      break;
    }

    case "rollback": {
      rollbackCommand();
      break;
    }

    case "upload": {
      uploadCommand(args);
      break;
    }

    default: {
      fail(`Invalid command: ${command}`);
    }
  }
};

main();
