import normalMode from './modes/normal';
import { other, next } from './keyboardProcessor';
import type { State } from './';

export const initialMode = normalMode;

/**
 * Merges a src tree into the target tree.
 *
 * Note that this alters the target tree.
 */
function mergeTrees(target, src, prefix = '') {
  // Then we merge all src properties into the targed object. We do this in 2 steps:
  // First we merge the functions and in the process we do error checking.
  // Then we recursively merge all submaps
  Reflect.ownKeys(src)
    .filter(key => typeof src[key] === 'function')
    .forEach((key) => {
      if (target[key]) {
        throw new Error(`Key sequence "${prefix}${key}" is registered as an action, but it is also ` +
                        'a prefix for other key combos.');
      }
      target[key] = src[key];
    });

  Reflect.ownKeys(src)
    .filter(key => typeof src[key] !== 'function')
    .forEach((key) => {
      const targetObj = target[key] || {};
      target[key] = mergeTrees(targetObj, src[key], prefix + key.toString());
    });

  return target;
}

/**
 * Converts a keymap into a keytree.
 *
 * A keymap can contain keysequences, the tree cannot. This functions converts a map of sequences
 * into a tree of single key strokes.
 *
 * The map may also contain tokens as keys, these will be copied as-is to the tree.
 *
 * Example:
 * in:
 * {
 *   'abc' : action1,
 *   'abd' : action2,
 *   'ac' : action3
 * }
 * out:
 * {
 *   'a' : {
 *     'b' : {
 *       'c' : action1,
 *       'd' : action2
 *     },
 *     'c' : action3
 *   }
 * }
 */
function mapToTree(map) {
  return Reflect.ownKeys(map)
    .map((keyCombo) => {
      // We can have symbols in here as well, which we consider to be single characters.
      if (typeof keyCombo === 'string') {
        return keyCombo.split('')
          .reduceRight((subTree, key) => ({ [key]: subTree }), map[keyCombo]);
      }
      return {
        [keyCombo]: map[keyCombo],
      };
    })
    .reduce((leftTree, rightTree) => mergeTrees(leftTree, rightTree), {});
}

/**
 * Transforms a key-tree to an async processor function that can be used by the keyboard processor.
 */
function treeToKeyProcessor(tree) {
  // We transform the key-tree into a "tree" of async functions that can delegate to each other.
  // Each key will be represented by an async function, and async functions will `await` to
  // subsequent async functions. E.g. for the motion 'abc' there will be an async function
  // called for 'a', which will `await` on the async function for `ab`, which will `await`
  // for the async function for `abc`.
  //
  // illustrative example:
  // in:
  // {
  //  'a' : {
  //    'a' : action1,
  //    'b' : action2
  //  },
  //  'b' : action3
  // }
  //
  // out (actual implementation is different, this is for illustration purposes only):
  // async function() {
  //  const { ch, key } = await next();
  //  if (ch === 'a') {
  //    await async function() {
  //      const { ch, key } = await net();
  //      if (ch === 'a') {
  //        await action1();
  //      } else if (ch === 'b') {
  //        await action2();
  //      }
  //    }();
  //  } else if (ch === 'b') {
  //    await action3();
  //  }
  // }

  // To get the desired result we first need to (recursively) get the sub
  // processors for each defined key
  const subProcessors = {};
  Reflect.ownKeys(tree)
    .forEach((key) => {
      if (typeof tree[key] === 'function') {
        subProcessors[key] = tree[key];
      } else {
        subProcessors[key] = treeToKeyProcessor(tree[key]);
      }
    });

  // Then we can use the subProcessors to create our root processors that will await a single key,
  // find the correct subProcessors, and then `await` on said processor.
  return async () => {
    const { ch, key } = await next();
    const target = key ? key.sequence : ch;
    const processKey = subProcessors[target] || subProcessors[other];
    if (processKey) {
      await processKey(ch, key);
    }
  };
}

export type KeyMap = {
  [string]: KeyMap | (ch: string, key: string) => Promise<mixed> | mixed
};
/**
 * Creates a mode processor function from a keymap.
 */
export function fromKeyMap(map: KeyMap) {
  return treeToKeyProcessor(mapToTree(map));
}

export type ProcessorFactory = (state: State, exit: () => void) => () => Promise<void>
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
