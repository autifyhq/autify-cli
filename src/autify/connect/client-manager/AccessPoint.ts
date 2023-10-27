/* eslint-disable unicorn/filename-case */
import { WebClient } from "@autifyhq/autify-sdk";
import { v4 as uuid } from "uuid";

const ACCESS_POINT_NAME_PREFIX = "autify-cli-";

interface StaticAccessPoint {
  readonly key: string;
  readonly name: string;
  readonly type: "static";
}

interface EphemeralAccessPoint {
  readonly delete: () => Promise<void>;
  readonly key: string;
  readonly name: string;
  readonly type: "ephemeral";
}

export type AccessPoint = EphemeralAccessPoint | StaticAccessPoint;

export const createStaticAccessPoint = (
  name: string,
  key: string
): StaticAccessPoint => ({ key, name, type: "static" });

export const createEphemeralAccessPointForWeb = async (
  client: WebClient,
  workspaceId: number
): Promise<EphemeralAccessPoint> => {
  const randomName = `${ACCESS_POINT_NAME_PREFIX}${uuid()}`;
  const res = await client.createAccessPoint(workspaceId, { name: randomName });
  const { name } = res.data;
  const { key } = res.data;
  return {
    async delete() {
      await client.deleteAccessPoint(workspaceId, {
        name,
      });
    },
    key,
    name,
    type: "ephemeral",
  };
};
