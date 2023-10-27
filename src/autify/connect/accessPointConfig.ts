/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";
import inquirer from "inquirer";

import { get, set } from "../../config";

export const confirmOverwriteAccessPoint = async (
  configDir: string
): Promise<void> => {
  const existingName = get(configDir, "AUTIFY_CONNECT_ACCESS_POINT_NAME");
  if (existingName) {
    const message = `You've already set an Access Point at ${configDir} (name: ${existingName}). Are you ok to clear its configuration from this machine?`;
    const res = await inquirer.prompt([
      {
        default: false,
        message,
        name: "confirmed",
        type: "confirm",
      },
    ]);
    if (!res.confirmed) {
      throw new CLIError(
        `Cancelled to overwrite the existing Access Point. It stays as is (name: ${existingName})`
      );
    }
  }
};

export const saveAccessPoint = (
  configDir: string,
  name: string,
  key: string
): string => {
  set(configDir, "AUTIFY_CONNECT_ACCESS_POINT_NAME", name);
  set(configDir, "AUTIFY_CONNECT_ACCESS_POINT_KEY", key);
  return (
    `Access Point name (${name}) and key (****) are stored in ${configDir}. ` +
    "Execute `autify connect client start` to start a client with this Access Point."
  );
};
