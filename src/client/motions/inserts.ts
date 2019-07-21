import { diffTypes } from '../../diff';
import insertMode from '../modes/insert';
import { State } from '../';

export default (state: State) => {
  const { window, contentManager } = state;
  return {
    i: async () => {
      await insertMode(state);
    },
    a: async () => {
      window.cursor.moveRight();
      await insertMode(state);
    },
    A: async () => {
      window.cursor.moveToEOL();
      await insertMode(state);
    },
    o: async () => {
      const diff = {
        type: diffTypes.INSERT,
        line: window.cursor.y,
        column: window.lineLength(window.cursor.y),
        text: '\n',
      };
      contentManager.processClientDiff(diff);
      // When we're at EOL then the newline gets inserted *before* the cursor, so it already moves
      // one line down in the diff processing. Therefore we can't move down when we're at EOL
      if (!window.cursor.eol) {
        window.cursor.moveDown();
      }
      await insertMode(state);
    },
    O: async () => {
      const diff = {
        type: diffTypes.INSERT,
        line: window.cursor.y,
        column: 0,
        text: '\n',
      };
      contentManager.processClientDiff(diff);
      window.cursor.moveUp();
      await insertMode(state);
    },
  };
};
