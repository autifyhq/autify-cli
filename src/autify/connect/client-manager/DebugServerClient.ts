/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";
import AbortController from "abort-controller";
import fetch from "node-fetch";

import { ClientEvents } from "./ClientManager";

type DebugServerRequest = Readonly<{
  method: string;
  path: string;
}>;

type DebugServerStatusResponse = Readonly<{
  message: string;
  status: "ready" | "reconnecting" | "starting";
}>;

export class DebugServerClient {
  private statusTimer: NodeJS.Timeout;

  constructor(
    private readonly port: number,
    private readonly clientEvents: ClientEvents
  ) {
    this.statusTimer = setInterval(async () => {
      try {
        const response = await this.requestStatus();
        this.clientEvents.emit(response.status, response.message);
      } catch (error) {
        this.clientEvents.emit("error", error as Error);
      }
    }, 1000);
  }

  public async requestStatus(): Promise<DebugServerStatusResponse> {
    const req = { method: "GET", path: "/status" };
    const res = (await this.request(req)) as DebugServerStatusResponse;
    if (res.status && res.message) return res;
    throw new CLIError(
      `Invalid response from ${JSON.stringify(req)}: ${JSON.stringify(res)}`
    );
  }

  public async requestTerminate(): Promise<void> {
    const req = { method: "POST", path: "/terminate" };
    await this.request(req);
  }

  public stopStatusTimer(): void {
    clearInterval(this.statusTimer);
  }

  private async request({ method, path }: DebugServerRequest) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    let response;
    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      response = await fetch(`http://127.0.0.1:${this.port}${path}`, {
        method,
        signal: controller.signal as any,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.ok) return response.json();
    throw new CLIError(
      `Request to debug server failed: ${method} ${path} => ${response.status} ${response.statusText}`
    );
  }
}
