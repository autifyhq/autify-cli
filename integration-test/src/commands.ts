export const iosBuildPath = "ios.app";
export const iosIPABuildPath = "ios.ipa";
export const androidBuildPath = "android.apk";

const webTestScenarioUrl =
  "https://app.autify.com/projects/743/scenarios/91437";
const webTestPlanUrl = "https://app.autify.com/projects/743/test_plans/169408";
const mobileAndroidTestPlanUrl =
  "https://mobile-app.autify.com/projects/4yyFEL/test_plans/Wptd97";
const mobileIosTestPlanUrl =
  "https://mobile-app.autify.com/projects/4yyFEL/test_plans/kYtlRR";
const mobileIosRealDeviceTestPlanUrl =
  "https://mobile-app.autify.com/projects/4yyFEL/test_plans/1EtZ0P";
const mobileWorkspaceId = "4yyFEL";
const mobileAndroidBuildId = "d1ulrD";
const mobileDeviceIds = "R5CY23ND1KE"; // Need to replace with your device ID(s) when you update the golden file.

const concatFlagAndValue = (args: string[]) => {
  const newArgs = [];
  let flag = null;
  for (const arg of args) {
    if (flag !== null) {
      if (arg.startsWith("-")) {
        newArgs.push(flag);
        flag = arg;
        continue;
      } else {
        newArgs.push(`${flag}=${arg}`);
        flag = null;
        continue;
      }
    }

    if (arg.startsWith("-")) {
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

const replaceMobileTetsPlanUrl = (
  arg: string,
  os: "android" | "ios" | "iosreal"
) => {
  const regExp =
    /^https:\/\/mobile-app.autify.com\/projects\/[^/]+\/test_plans\/[^/]+\/?$/;
  if (regExp.test(arg)) {
    if (os === "android") return mobileAndroidTestPlanUrl;
    if (os === "ios") return mobileIosTestPlanUrl;
    if (os === "iosreal") return mobileIosRealDeviceTestPlanUrl;
  }

  return arg;
};

const replaceMobileWorkspaceId = (arg: string) =>
  arg.startsWith("--workspace-id=")
    ? `--workspace-id=${mobileWorkspaceId}`
    : arg;
const replaceMobileAndroidBuildId = (arg: string) =>
  arg.startsWith("--build-id=") ? `--build-id=${mobileAndroidBuildId}` : arg;
const replaceMobileDeviceIds = (arg: string) =>
  arg.startsWith("--device-ids=") ? `--device-ids=${mobileDeviceIds}` : arg;
const replaceMobileAndroidBuildPath = (arg: string) =>
  arg.replace(/^(--[^=]+=)?.+\.apk$/, `$1${androidBuildPath}`);
const replaceMobileIosBuildPath = (arg: string) =>
  arg.replace(/^(--[^=]+=)?.+\.app$/, `$1${iosBuildPath}`);
const replaceMobileIosIPABuildPath = (arg: string) =>
  arg.replace(/^(--[^=]+=)?.+\.ipa/, `$1${iosIPABuildPath}`);

// Assuming ios command contains .app
const isIos = (args: string[]) => args.some((a) => a.endsWith(".app"));
const isIosIPA = (args: string[]) => args.some((a) => a.endsWith(".ipa"));

const replaceConstants = (args: string[]) => {
  if (args[0] === "web") {
    return args
      .map((a) => replaceWebTestScenarioUrl(a))
      .map((a) => replaceWebTestPlanUrl(a));
  }

  if (args[0] === "mobile") {
    if (isIos(args)) {
      return args
        .map((a) => replaceMobileWorkspaceId(a))
        .map((a) => replaceMobileTetsPlanUrl(a, "ios"))
        .map((a) => replaceMobileIosBuildPath(a));
    }

    if (isIosIPA(args)) {
      return args
        .map((a) => replaceMobileWorkspaceId(a))
        .map((a) => replaceMobileTetsPlanUrl(a, "iosreal"))
        .map((a) => replaceMobileIosIPABuildPath(a));
    }

    return args
      .map((a) => replaceMobileWorkspaceId(a))
      .map((a) => replaceMobileTetsPlanUrl(a, "android"))
      .map((a) => replaceMobileAndroidBuildId(a))
      .map((a) => replaceMobileDeviceIds(a))
      .map((a) => replaceMobileAndroidBuildPath(a));
  }

  return args;
};

const DEFAULT_ARGUMENTS = new Set(["-t=300"]);

export const normalizeCommand = (args: string[]): string[] =>
  replaceConstants(concatFlagAndValue(args)).filter(
    (arg) => !DEFAULT_ARGUMENTS.has(arg)
  );
