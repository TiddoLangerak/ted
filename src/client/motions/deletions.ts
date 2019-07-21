/* @flow */
import { copy } from 'copy-paste';
import { keys, next, peek } from '../keyboardProcessor';
import { diffTypes } from '../../diff';
import search from './search';
import movement from './movement';
import { fromKeyMap } from '../modes';
import type { State } from '../';

async function deleteMovement(state) {
  const { ch } = await peek();
  const firstChar = ch;

  const { window } = state;
  const deleteMotionProcessor = fromKeyMap({
    ...search(state),
    ...movement(state),
  });

  await deleteMotionProcessor();
  // Some movements behave a bit different when used as deletion, so we fixup those here
  if ('eEft'.indexOf(firstChar) !== -1) {
    window.cursor.moveRight();
  }
}

export async function deleteUnderMovement(state: State) {
  const { window, contentManager } = state;
  let from = {
    line: window.cursor.y,
    column: window.cursor.x,
  };
  await deleteMovement(state);
  let to = {
    line: window.cursor.y,
    column: window.cursor.x,
  };
  // If this is a backwards deletion then we need to swap to and from.
  if (to.line < from.line || (to.line === from.line && to.column < from.column)) {
    const temp = to;
    to = from;
    from = temp;
  }
  const diff = {
    type: diffTypes.DELETE,
    from,
    to,
    text: window.getText(from, to),
  };
  contentManager.processClientDiff(diff);
}

export function removeLine({ window, contentManager }: State) {
  const line = window.getLines()[window.cursor.y];
  copy(`${line}\n`);
  const from = {
    line: window.cursor.y,
    column: 0,
  };
  const to = {
    line: window.cursor.y + 1,
    column: 0,
  };
  // If this is the last line then we want to remove the trailing newline as well, so we extent
  // the range slightly
  if (window.getLines().length - 1 === window.cursor.y && window.cursor.y !== 0) {
    from.line -= 1;
    from.column = window.lineLength(from.line);
  }
  const diff = {
    type: diffTypes.DELETE,
    from,
    to,
    text: window.getText(from, to),
  };
  contentManager.processClientDiff(diff);
}

export default (state: State) => ({
  d: async () => {
    const { ch } = await peek();
    if (ch === 'd') {
        // We now do want to pop the character, so we can call next.
      next();
      removeLine(state);
    } else if (ch !== keys.escape) {
      await deleteUnderMovement(state);
    }
  },
});
