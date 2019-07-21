import normalMode from './modes/normal';
import { other, next, Key } from './keyboardProcessor';
import { State } from "./state";

// TODO:
// currently, typescript doesn't support using 'symbol' as index type, and to work around this we
// have a large number of `any` casts in this file. These can be removed once TS supports this.

export const initialMode = normalMode;

type ProcessKey = (ch: string, key: Key) => Promise<unknown> | void;

export interface KeyMap {
  [key: string]: ProcessKey | KeyMap
  [other]?: ProcessKey | KeyMap
};

// The effective difference between KeyTree and KeyMap is that a keytree cannot contain key_sequences_ as a keys.
// We cannot model this however in TypeScript, hence it's just an alias for now.
type KeyTree = KeyMap;

/**
 * Merges a src tree into the target tree.
 *
 * Note that this alters the target tree.
 */
function mergeTrees(target: KeyTree, src: KeyTree, prefix = '') {
  // Then we merge all src properties into the targed object. We do this in 2 steps:
  // First we merge the functions and in the process we do error checking.
  // Then we recursively merge all submaps
  Reflect.ownKeys(src)
    .filter(key => typeof src[key as any] === 'function')
    .forEach((key) => {
      if (target[key as any]) {
        throw new Error(`Key sequence "${prefix}${String(key)}" is registered as an action, but it is also ` +
                        'a prefix for other key combos.');
      }
      target[key as any] = src[key as any];
    });

  Reflect.ownKeys(src)
    .filter(key => typeof src[key as any] !== 'function')
    .forEach((key) => {
      const targetObj = target[key as any] as KeyMap || {};
      target[key as any] = mergeTrees(targetObj, src[key as any] as KeyMap, prefix + key.toString() + ".");
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
function mapToTree(map: KeyMap) {
  return Reflect.ownKeys(map)
    .map((keyCombo) : KeyTree => {
      // We can have symbols in here as well, which we consider to be single characters.
      if (typeof keyCombo === 'string') {
        const [firstKey, ...otherKeys] = keyCombo.split('');
        const leaf : KeyTree = { [firstKey] : map[keyCombo] };
        return otherKeys
          .reduceRight((subTree, key) => ({ [key]: subTree }), leaf);
      }
      return {
        [keyCombo as any]: map[keyCombo as any],
      };
    })
    .reduce((leftTree: KeyTree, rightTree: KeyTree) => mergeTrees(leftTree, rightTree), {});
}

interface KeyProcessorMap {
  [key: string]: ProcessKey;
  [other]?: ProcessKey;
}

/**
 * Transforms a key-tree to an async processor function that can be used by the keyboard processor.
 */
function treeToKeyProcessor(tree: KeyTree): KeyProcessor {
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
  const subProcessors : KeyProcessorMap = {};
  Reflect.ownKeys(tree)
    .forEach((key) => {
      const keyNode = tree[key as any];
      if (typeof keyNode === 'function') {
        subProcessors[key as any] = keyNode;
      } else {
        subProcessors[key as any] = treeToKeyProcessor(keyNode);
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

type KeyProcessor = () => Promise<unknown>;
/**
 * Creates a mode processor function from a keymap.
 */
export function fromKeyMap(map: KeyMap) : KeyProcessor {
  return treeToKeyProcessor(mapToTree(map));
}

