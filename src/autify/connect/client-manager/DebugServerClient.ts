/* eslint-disable unicorn/filename-case */
import { CLIError } from "@oclif/errors";
import fetch from "node-fetch";
import { ClientEvents } from "./ClientManager";
import AbortController from "abort-controller";

type DebugServerRequest = Readonly<{
  method: string;
  path: string;
}>;

type DebugServerStatusResponse = Readonly<{
  status: "starting" | "ready" | "reconnecting";
  message: string;
}>;

export class DebugServerClient {
  private statusTimer?: NodeJS.Timer;

  constructor(
    private readonly port: number,
    private readonly clientEvents: ClientEvents
  ) {}

  public startStatusTimer(interval: number): void {
    this.statusTimer = setInterval(async () => {
      try {
        const response = await this.requestStatus();
        this.clientEvents.emit(response.status, response.message);
      } catch (error) {
        this.clientEvents.emit("error", error as Error);
      }
    }, interval);
  }

  public stopStatusTimer(): void {
    clearInterval(this.statusTimer);
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

  private async request({ method, path }: DebugServerRequest) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    let response;
    try {
      response = await fetch(`http://localhost:${this.port}${path}`, {
        method,
        signal: controller.signal,
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
