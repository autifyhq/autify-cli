import execa from "execa";

export type Simulator = {
  isAvailable: boolean;
  name: string;
  udid: string;
};

export const pickupOneSimulator = async (): Promise<null | Simulator> => {
  const { stdout } = await execa("xcrun", [
    "simctl",
    "list",
    "devices",
    "--json",
  ]);
  const { devices } = JSON.parse(stdout);
  const simulators = (Object.values(devices).flat() as Simulator[]).filter(
    (device) => device.isAvailable && device.name.includes("iPhone")
  );
  if (simulators.length === 0) {
    return null;
  }

  return simulators[0];
};
