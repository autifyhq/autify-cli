/* eslint-disable unicorn/filename-case */
import { assign, createMachine, interpret, Interpreter } from "xstate";
import { StateMachineTimeoutError, ProcessExit } from "./ClientManager";

type ClientStateMachineContext = {
  spawn: (debugServerPort: number) => void;
  terminate: () => Promise<void>;
  kill: () => void;
  cleanup: () => Promise<void>;
  processExit?: ProcessExit;
  errors: Error[];
};

type ClientStateMachineEvent =
  | { type: "SPAWN"; debugServerPort: number }
  | { type: "READY" }
  | { type: "TERMINATE" }
  | { type: "FAIL"; error: Error }
  | { type: "EXIT"; processExit: ProcessExit };

type ClientStateMachineState =
  | { value: "init"; context: ClientStateMachineContext }
  | { value: "starting"; context: ClientStateMachineContext }
  | { value: "ready"; context: ClientStateMachineContext }
  | { value: "terminating"; context: ClientStateMachineContext }
  | { value: "killing"; context: ClientStateMachineContext }
  | { value: "timeout"; context: ClientStateMachineContext }
  | { value: "cleanup"; context: ClientStateMachineContext }
  | {
      value: "done";
      context: ClientStateMachineContext & { processExit: ProcessExit };
    };

export type ClientStateMachineService = Interpreter<
  ClientStateMachineContext,
  any,
  ClientStateMachineEvent,
  ClientStateMachineState,
  any
>;

export const createService = (
  context: ClientStateMachineContext
): ClientStateMachineService => {
  const machine = createMachine<
    ClientStateMachineContext,
    ClientStateMachineEvent,
    ClientStateMachineState
  >({
    predictableActionArguments: true,
    schema: {
      context: {} as ClientStateMachineContext,
    },
    context,
    initial: "init",
    states: {
      init: {
        on: {
          SPAWN: { target: "starting" },
          FAIL: {
            target: "cleanup",
            actions: assign({
              errors: (context, event) => {
                context.errors.push(event.error);
                return context.errors;
              },
            }),
          },
        },
      },
      starting: {
        entry: (context, event) => {
          if (event.type !== "SPAWN") return;
          context.spawn(event.debugServerPort);
        },
        on: {
          READY: { target: "ready" },
          TERMINATE: { target: "terminating" },
          EXIT: {
            target: "cleanup",
            actions: assign({
              processExit: (_, event) => event.processExit,
            }),
          },
        },
        after: {
          3000: {
            target: "terminating",
            actions: assign({
              errors: (context) => {
                context.errors.push(new StateMachineTimeoutError("starting"));
                return context.errors;
              },
            }),
          },
        },
      },
      ready: {
        on: {
          TERMINATE: { target: "terminating" },
          EXIT: {
            target: "cleanup",
            actions: assign({
              processExit: (_, event) => event.processExit,
            }),
          },
        },
      },
      terminating: {
        invoke: {
          src: (context) => context.terminate(),
        },
        on: {
          TERMINATE: { target: "killing" },
          EXIT: {
            target: "cleanup",
            actions: assign({
              processExit: (_, event) => event.processExit,
            }),
          },
        },
        after: {
          3000: { target: "killing" },
        },
      },
      killing: {
        entry: (context) => context.kill(),
        on: {
          TERMINATE: { target: "cleanup" },
          EXIT: {
            target: "cleanup",
            actions: assign({
              processExit: (_, event) => event.processExit,
            }),
          },
        },
        after: {
          2000: {
            target: "failed",
            actions: assign({
              errors: (context) => {
                context.errors.push(new StateMachineTimeoutError("killing"));
                return context.errors;
              },
            }),
          },
        },
      },
      cleanup: {
        invoke: {
          src: (context) => context.cleanup(),
          onDone: [
            { target: "failed", cond: (context) => context.errors.length > 0 },
            { target: "done" },
          ],
          onError: {
            target: "failed",
            actions: assign({
              errors: (context, event) => {
                context.errors.push(event.data);
                return context.errors;
              },
            }),
          },
        },
        after: {
          2000: {
            target: "failed",
            actions: assign({
              errors: (context) => {
                context.errors.push(new StateMachineTimeoutError("cleanup"));
                return context.errors;
              },
            }),
          },
        },
      },
      done: {
        type: "final",
      },
      failed: {
        type: "final",
        entry: (context) => context.kill(),
      },
    },
  });

  return interpret(machine).start();
};
