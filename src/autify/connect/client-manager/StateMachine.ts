/* eslint-disable unicorn/filename-case */
import { Interpreter, assign, createMachine, interpret } from "xstate";

import { ProcessExit, StateMachineTimeoutError } from "./ClientManager";

type ClientStateMachineContext = {
  cleanup: () => Promise<void>;
  errors: Error[];
  kill: () => void;
  processExit?: ProcessExit;
  spawn: (debugServerPort: number) => void;
  terminate: () => Promise<void>;
};

type ClientStateMachineEvent =
  | { debugServerPort: number; type: "SPAWN" }
  | { error: Error; type: "FAIL" }
  | { processExit: ProcessExit; type: "EXIT" }
  | { type: "READY" }
  | { type: "TERMINATE" };

type ClientStateMachineState =
  | {
      context: ClientStateMachineContext & { processExit: ProcessExit };
      value: "done";
    }
  | { context: ClientStateMachineContext; value: "cleanup" }
  | { context: ClientStateMachineContext; value: "init" }
  | { context: ClientStateMachineContext; value: "killing" }
  | { context: ClientStateMachineContext; value: "ready" }
  | { context: ClientStateMachineContext; value: "starting" }
  | { context: ClientStateMachineContext; value: "terminating" }
  | { context: ClientStateMachineContext; value: "timeout" };

/* eslint-disable @typescript-eslint/no-explicit-any */
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
    context,
    initial: "init",
    predictableActionArguments: true,
    schema: {
      context: {} as ClientStateMachineContext,
    },
    states: {
      cleanup: {
        after: {
          2000: {
            actions: assign({
              errors(context) {
                context.errors.push(new StateMachineTimeoutError("cleanup"));
                return context.errors;
              },
            }),
            target: "failed",
          },
        },
        invoke: {
          onDone: [
            { cond: (context) => context.errors.length > 0, target: "failed" },
            { target: "done" },
          ],
          onError: {
            actions: assign({
              errors(context, event) {
                context.errors.push(event.data);
                return context.errors;
              },
            }),
            target: "failed",
          },
          src: (context) => context.cleanup(),
        },
      },
      done: {
        type: "final",
      },
      failed: {
        entry: (context) => context.kill(),
        type: "final",
      },
      init: {
        on: {
          FAIL: {
            actions: assign({
              errors(context, event) {
                context.errors.push(event.error);
                return context.errors;
              },
            }),
            target: "cleanup",
          },
          SPAWN: { target: "starting" },
        },
      },
      killing: {
        after: {
          2000: {
            actions: assign({
              errors(context) {
                context.errors.push(new StateMachineTimeoutError("killing"));
                return context.errors;
              },
            }),
            target: "failed",
          },
        },
        entry: (context) => context.kill(),
        on: {
          EXIT: {
            actions: assign({
              processExit: (_, event) => event.processExit,
            }),
            target: "cleanup",
          },
          TERMINATE: { target: "cleanup" },
        },
      },
      ready: {
        on: {
          EXIT: {
            actions: assign({
              processExit: (_, event) => event.processExit,
            }),
            target: "cleanup",
          },
          TERMINATE: { target: "terminating" },
        },
      },
      starting: {
        after: {
          3000: {
            actions: assign({
              errors(context) {
                context.errors.push(new StateMachineTimeoutError("starting"));
                return context.errors;
              },
            }),
            target: "terminating",
          },
        },
        entry(context, event) {
          if (event.type !== "SPAWN") return;
          context.spawn(event.debugServerPort);
        },
        on: {
          EXIT: {
            actions: assign({
              processExit: (_, event) => event.processExit,
            }),
            target: "cleanup",
          },
          READY: { target: "ready" },
          TERMINATE: { target: "terminating" },
        },
      },
      terminating: {
        after: {
          3000: { target: "killing" },
        },
        invoke: {
          src: (context) => context.terminate(),
        },
        on: {
          EXIT: {
            actions: assign({
              processExit: (_, event) => event.processExit,
            }),
            target: "cleanup",
          },
          TERMINATE: { target: "killing" },
        },
      },
    },
  });

  return interpret(machine).start();
};
