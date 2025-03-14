/* eslint-disable unicorn/filename-case */
import { assign, createMachine, interpret, Interpreter } from "xstate";
import { StateMachineTimeoutError, ProcessExit } from "./MobileLinkManager";

type MobileLinkStateMachineContext = {
  start: (workspaceId?: string) => void;
  terminate: () => Promise<void>;
  kill: () => void;
  cleanup: () => Promise<void>;
  processExit?: ProcessExit;
  errors: Error[];
};

type MobileLinkStateMachineEvent =
  | { type: "START"; workspaceId?: string }
  | { type: "READY" }
  | { type: "TERMINATE" }
  | { type: "FAIL"; error: Error }
  | { type: "EXIT"; processExit: ProcessExit };

type MobileLinkStateMachineState =
  | { value: "init"; context: MobileLinkStateMachineContext }
  | { value: "starting"; context: MobileLinkStateMachineContext }
  | { value: "ready"; context: MobileLinkStateMachineContext }
  | { value: "terminating"; context: MobileLinkStateMachineContext }
  | { value: "killing"; context: MobileLinkStateMachineContext }
  | { value: "timeout"; context: MobileLinkStateMachineContext }
  | {
      value: "done";
      context: MobileLinkStateMachineContext & { processExit: ProcessExit };
    };

export type MobileLinkStateMachineService = Interpreter<
  MobileLinkStateMachineContext,
  any,
  MobileLinkStateMachineEvent,
  MobileLinkStateMachineState,
  any
>;

export const createService = (
  context: MobileLinkStateMachineContext
): MobileLinkStateMachineService => {
  const machine = createMachine<
    MobileLinkStateMachineContext,
    MobileLinkStateMachineEvent,
    MobileLinkStateMachineState
  >({
    predictableActionArguments: true,
    schema: {
      context: {} as MobileLinkStateMachineContext,
    },
    context,
    initial: "init",
    states: {
      init: {
        on: {
          START: { target: "starting" },
          FAIL: {
            target: "done",
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
          if (event.type !== "START") return;
          context.start(event.workspaceId);
        },
        on: {
          READY: { target: "ready" },
          TERMINATE: { target: "terminating" },
          EXIT: {
            target: "done",
            actions: assign({
              processExit: (_, event) => event.processExit,
            }),
          },
        },
        after: {
          10_000: {
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
            target: "done",
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
            target: "done",
            actions: assign({
              processExit: (_, event) => event.processExit,
            }),
          },
        },
        after: {
          10_000: { target: "killing" },
        },
      },
      killing: {
        entry: (context) => context.kill(),
        on: {
          TERMINATE: { target: "done" },
          EXIT: {
            target: "done",
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
