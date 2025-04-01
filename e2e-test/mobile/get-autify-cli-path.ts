// Autify CLI is expected to be globally installed through the install workflow on CI but you can specify a specific
// binary when you run jest locally.
export const getAutifyCliPath = (): string =>
  process.env.AUTIFY_CLI_PATH ?? "autify";
