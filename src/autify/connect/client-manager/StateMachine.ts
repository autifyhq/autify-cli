/* eslint-disable unicorn/filename-case */
import { assign, createMachine, interpret, Interpreter } from "xstate";
import { ProcessExit } from "./ClientManager";

type ClientStateMachineContext = {
  terminate: () => Promise<void>;
  kill: () => void;
  cleanup: () => Promise<void>;
  processExit?: ProcessExit;
  timeout?: boolean;
};

type ClientStateMachineEvent =
  | { type: "SPAWN" }
  | { type: "READY" }
  | { type: "TERMINATE" }
  | { type: "EXIT"; processExit: ProcessExit };

type ClientStateMachineState =
  | { value: "init"; context: ClientStateMachineContext }
  | { value: "starting"; context: ClientStateMachineContext }
  | { value: "ready"; context: ClientStateMachineContext }
  | { value: "terminating"; context: ClientStateMachineContext }
  | { value: "killing"; context: ClientStateMachineContext }
  | { value: "timeout"; context: ClientStateMachineContext }
  | {
      value: "exited";
      context: ClientStateMachineContext & { processExit: ProcessExit };
    }
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
        },
      },
      starting: {
        on: {
          READY: { target: "ready" },
          EXIT: {
            target: "exited",
            actions: assign({
              processExit: (_, event) => event.processExit,
            }),
          },
        },
        after: {
          3000: {
            target: "terminating",
            actions: assign({
              timeout: (_) => true,
            }),
          },
        },
      },
      ready: {
        on: {
          TERMINATE: { target: "terminating" },
          EXIT: {
            target: "exited",
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
            target: "exited",
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
          TERMINATE: { target: "exited" },
          EXIT: {
            target: "exited",
            actions: assign({
              processExit: (_, event) => event.processExit,
            }),
          },
        },
        after: {
          2000: { target: "timeout" },
        },
      },
      exited: {
        invoke: {
          src: (context) => context.cleanup(),
          onDone: [
            { target: "timeout", cond: (context) => context.timeout === true },
            { target: "done" },
          ],
        },
        after: {
          2000: {
            target: "timeout",
            actions: assign({
              timeout: (_) => true,
            }),
          },
        },
      },
      done: {
        type: "final",
      },
      timeout: {
        type: "final",
        entry: (context) => context.kill(),
      },
    },
  });

  return interpret(machine).start();
};
