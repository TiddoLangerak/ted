/* @flow */
import { keys, other } from '../keyboardProcessor';
import { diffTypes } from '../../diff';
import { isCharKey } from '../motions/utils';
import { fromKeyMap, loopingMode } from '../modes';

export default loopingMode('insert', (state, exitMode) => {
  const { window, contentManager } = state;
  return fromKeyMap({
    [keys.ESCAPE]: () => {
      window.cursor.moveLeft();
      exitMode();
    },
    [keys.BACKSPACE]: () => {
      if (window.cursor.y === 0 && window.cursor.x === 0) {
        return;
      }
      const to = {
        line: window.cursor.y,
        column: window.cursor.x,
      };
      let from;
      if (window.cursor.x > 0) {
        from = {
          line: window.cursor.y,
          column: window.cursor.x - 1,
        };
      } else {
        from = {
          line: window.cursor.y - 1,
          column: window.lineLength(window.cursor.y - 1),
        };
      }
      const diff = {
        type: diffTypes.DELETE,
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
        const diff = {
          type: diffTypes.INSERT,
          line: window.cursor.y,
          column: window.cursor.x,
          text,
        };
        contentManager.processClientDiff(diff);
      }
    },
  });
});
