export const iosBuildPath = "ios.app";
export const androidBuildPath = "android.apk";

const webTestScenarioUrl =
  "https://app.autify.com/projects/743/scenarios/91437";
const webTestPlanUrl = "https://app.autify.com/projects/743/test_plans/169408";
const mobileAndroidTestPlanUrl =
  "https://mobile-app.autify.com/projects/4yyFEL/test_plans/Wptd97";
const mobileIosTestPlanUrl =
  "https://mobile-app.autify.com/projects/4yyFEL/test_plans/kYtlRR";
const mobileWorkspaceId = "4yyFEL";
const mobileAndroidBuildId = "d1ulrD";

const concatFlagAndValue = (args: string[]) => {
  const newArgs = [];
  let flag = null;
  for (const arg of args) {
    if (flag !== null) {
      if (arg.startsWith("--")) {
        newArgs.push(flag);
        flag = arg;
        continue;
      } else {
        newArgs.push(`${flag}=${arg}`);
        flag = null;
        continue;
      }
    }

    if (arg.startsWith("--")) {
      flag = arg;
      continue;
    }

    newArgs.push(arg);
  }

  if (flag !== null) newArgs.push(flag);

  return newArgs;
};

const replaceWebTestScenarioUrl = (arg: string) => {
  const regExp = /^https:\/\/app.autify.com\/projects\/\d+\/scenarios\/\d+\/?$/;
  return regExp.test(arg) ? webTestScenarioUrl : arg;
};

const replaceWebTestPlanUrl = (arg: string) => {
  const regExp =
    /^https:\/\/app.autify.com\/projects\/\d+\/test_plans\/\d+\/?$/;
  return regExp.test(arg) ? webTestPlanUrl : arg;
};

const replaceMobileTetsPlanUrl = (arg: string, os: "android" | "ios") => {
  const regExp =
    /^https:\/\/mobile-app.autify.com\/projects\/[^/]+\/test_plans\/[^/]+\/?$/;
  if (regExp.test(arg)) {
    if (os === "android") return mobileAndroidTestPlanUrl;
    if (os === "ios") return mobileIosTestPlanUrl;
  }

  return arg;
};

const replaceMobileWorkspaceId = (arg: string) =>
  arg.startsWith("--workspace-id=")
    ? `--workspace-id=${mobileWorkspaceId}`
    : arg;
const replaceMobileAndroidBuildId = (arg: string) =>
  arg.startsWith("--build-id=") ? `--build-id=${mobileAndroidBuildId}` : arg;
const replaceMobileAndroidBuildPath = (arg: string) =>
  arg.replace(/^(--[^=]+=)?.+\.apk$/, `$1${androidBuildPath}`);
const replaceMobileIosBuildPath = (arg: string) =>
  arg.replace(/^(--[^=]+=)?.+\.app$/, `$1${iosBuildPath}`);

// Assuming ios command contains .app
const isIos = (args: string[]) => args.some((a) => a.endsWith(".app"));

const replaceConstants = (args: string[]) => {
  if (args[0] === "web") {
    return args
      .map((a) => replaceWebTestScenarioUrl(a))
      .map((a) => replaceWebTestPlanUrl(a));
  }

  if (args[0] === "mobile") {
    return isIos(args)
      ? args
          .map((a) => replaceMobileWorkspaceId(a))
          .map((a) => replaceMobileTetsPlanUrl(a, "ios"))
          .map((a) => replaceMobileIosBuildPath(a))
      : args
          .map((a) => replaceMobileWorkspaceId(a))
          .map((a) => replaceMobileTetsPlanUrl(a, "android"))
          .map((a) => replaceMobileAndroidBuildId(a))
          .map((a) => replaceMobileAndroidBuildPath(a));
  }

  return args;
};

export const normalizeCommand = (args: string[]): string[] =>
  replaceConstants(concatFlagAndValue(args));
