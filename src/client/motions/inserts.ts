import { DiffType, InsertDiff } from "../../diff";
import insertMode from "../modes/insert";
import { State } from "../state";

export default (state: State) => {
  const { window, contentManager } = state;
  const cursor = window.getCursor();
  return {
    i: async () => {
      await insertMode(state);
    },
    a: async () => {
      cursor.moveRight();
      await insertMode(state);
    },
    A: async () => {
      cursor.moveToEOL();
      await insertMode(state);
    },
    o: async () => {
      const diff: InsertDiff = {
        type: DiffType.INSERT,
        line: cursor.y,
        column: window.lineLength(cursor.y),
        text: "\n"
      };
      contentManager.processClientDiff(diff);
      // When we're at EOL then the newline gets inserted *before* the cursor, so it already moves
      // one line down in the diff processing. Therefore we can't move down when we're at EOL
      if (!cursor.eol) {
        cursor.moveDown();
      }
      await insertMode(state);
    },
    O: async () => {
      const diff: InsertDiff = {
        type: DiffType.INSERT,
        line: cursor.y,
        column: 0,
        text: "\n"
      };
      contentManager.processClientDiff(diff);
      cursor.moveUp();
      await insertMode(state);
    }
  };
};
