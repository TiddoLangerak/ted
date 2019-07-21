import { keys, other } from '../keyboardProcessor';
import { DiffType, Diff } from '../../diff';
import { isCharKey } from '../motions/utils';
import { fromKeyMap } from '../modes';
import { loopingMode } from "./loopingMode";

export default loopingMode('insert', (state, exitMode) => {
  const { window, contentManager } = state;
  const cursor = window.getCursor();
  return fromKeyMap({
    [keys.ESCAPE]: () => {
      cursor.moveLeft();
      exitMode();
    },
    [keys.BACKSPACE]: () => {
      if (cursor.y === 0 && cursor.x === 0) {
        return;
      }
      const to = {
        line: cursor.y,
        column: cursor.x,
      };
      let from;
      if (cursor.x > 0) {
        from = {
          line: cursor.y,
          column: cursor.x - 1,
        };
      } else {
        from = {
          line: cursor.y - 1,
          column: window.lineLength(cursor.y - 1),
        };
      }
      const diff: Diff = {
        type: DiffType.DELETE,
        from,
        to,
        text: window.getText(from, to),
      };
      contentManager.processClientDiff(diff);
    },
    [other]: (ch, key) => {
      if (isCharKey(ch, key)) {
        let text = ch;
        // TODO: this better
        if (ch === '\r') {
          text = '\n';
        }
        const diff : Diff = {
          type: DiffType.INSERT,
          line: cursor.y,
          column: cursor.x,
          text,
        };
        contentManager.processClientDiff(diff);
      }
    },
  });
});
