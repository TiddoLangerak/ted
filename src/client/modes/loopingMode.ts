import { State } from "../state";

export type ProcessorFactory = (
  state: State,
  exit: () => void
) => () => Promise<unknown> | void;
/**
 * Creates a mode that keeps active until explicitely closed.
 *
 * This function abstracts the boilerplate for the major, "real" modes away. It sets the name of
 * the mode when the mode starts, and then starts the mode in infinite loop mode.
 *
 * @param {String} name The name of the mode. Will be displayed in the status bar.
 * @param {Function} factoryFunc A function that creates the mode processor. It receives the mode
 *                               state as first parameter and an `exitMode` function as second
 *                               parameter, which can be used to exit the mode.
 */
export function loopingMode(name: string, factoryFunc: ProcessorFactory) {
  return async (state: State) => {
    if (name) {
      state.setCurrentMode(name);
    }
    let isActive = true;
    function exitMode() {
      isActive = false;
    }
    const looper = factoryFunc(state, exitMode);
    while (isActive) {
      // eslint-disable-next-line no-await-in-loop
      await looper();
    }
  };
}
