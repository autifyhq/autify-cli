/* eslint-disable unicorn/filename-case */
import { WebClient } from "@autifyhq/autify-sdk";
import { v4 as uuid } from "uuid";

const ACCESS_POINT_NAME_PREFIX = "autify-cli-";

interface StaticAccessPoint {
  readonly type: "static";
  readonly name: string;
  readonly key: string;
}

interface EphemeralAccessPoint {
  readonly type: "ephemeral";
  readonly name: string;
  readonly key: string;
  readonly delete: () => Promise<void>;
}

export type AccessPoint = StaticAccessPoint | EphemeralAccessPoint;

export const createStaticAccessPoint = (
  name: string,
  key: string
): StaticAccessPoint => {
  return { type: "static", name, key };
};

export const createEphemeralAccessPointForWeb = async (
  client: WebClient,
  workspaceId: number
): Promise<EphemeralAccessPoint> => {
  const randomName = `${ACCESS_POINT_NAME_PREFIX}${uuid()}`;
  const res = await client.createAccessPoint(workspaceId, { name: randomName });
  const name = res.data.name;
  const key = res.data.key;
  return {
    type: "ephemeral",
    name,
    key,
    delete: async () => {
      await client.deleteAccessPoint(workspaceId, {
        name,
      });
    },
  };
};
