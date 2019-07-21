import { copy } from "copy-paste";
import { keys, next, peek } from "../keyboardProcessor";
import { DiffType, DeleteDiff } from "../../diff";
import search from "./search";
import movement from "./movement";
import { fromKeyMap } from "../modes";
import { State } from "../state";

async function deleteMovement(state: State) {
  const { ch } = await peek();
  const firstChar = ch;

  const { window } = state;
  const cursor = window.getCursor();
  const deleteMotionProcessor = fromKeyMap({
    ...search(state),
    ...movement(state)
  });

  await deleteMotionProcessor();
  // Some movements behave a bit different when used as deletion, so we fixup those here
  if ("eEft".indexOf(firstChar) !== -1) {
    cursor.moveRight();
  }
}

export async function deleteUnderMovement(state: State) {
  const { window, contentManager } = state;
  const cursor = window.getCursor();
  let from = {
    line: cursor.y,
    column: cursor.x
  };
  await deleteMovement(state);
  let to = {
    line: cursor.y,
    column: cursor.x
  };
  // If this is a backwards deletion then we need to swap to and from.
  if (
    to.line < from.line ||
    (to.line === from.line && to.column < from.column)
  ) {
    const temp = to;
    to = from;
    from = temp;
  }
  const diff: DeleteDiff = {
    type: DiffType.DELETE,
    from,
    to,
    text: window.getText(from, to)
  };
  contentManager.processClientDiff(diff);
}

export function removeLine({ window, contentManager }: State) {
  const cursor = window.getCursor();
  const line = window.getLines()[cursor.y];
  copy(`${line}\n`);
  const from = {
    line: cursor.y,
    column: 0
  };
  const to = {
    line: cursor.y + 1,
    column: 0
  };
  // If this is the last line then we want to remove the trailing newline as well, so we extent
  // the range slightly
  if (window.getLines().length - 1 === cursor.y && cursor.y !== 0) {
    from.line -= 1;
    from.column = window.lineLength(from.line);
  }
  const diff: DeleteDiff = {
    type: DiffType.DELETE,
    from,
    to,
    text: window.getText(from, to)
  };
  contentManager.processClientDiff(diff);
}

export default (state: State) => ({
  d: async () => {
    const { ch } = await peek();
    if (ch === "d") {
      // We now do want to pop the character, so we can call next.
      next();
      removeLine(state);
    } else if (ch !== keys.ESCAPE) {
      await deleteUnderMovement(state);
    }
  }
});
