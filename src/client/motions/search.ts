/* @flow */
import { other } from '../keyboardProcessor';
import { isCharKey } from './utils';
import type { State } from '../';

export default ({ window }: State) => {
  function searchMotion(searchFunc) {
    return {
      [other]: (ch, key) => {
        if (isCharKey(ch, key)) {
          searchFunc(ch);
        }
      },
    };
  }
  return {
    f: searchMotion((ch) => {
      const offset = window.getLines()[window.cursor.y]
        // We don't want to find the current character, so a +1 offset here
        .substr(window.cursor.x + 1)
        .indexOf(ch) + 1; // +1 to compensate for the +1 above
      if (offset >= 0) {
        window.cursor.moveRight(offset);
      }
    }),
    F: searchMotion((ch) => {
      const xPos = window.getLines()[window.cursor.y]
        .substr(0, window.cursor.x)
        .lastIndexOf(ch);
      if (xPos >= 0) {
        window.cursor.update((cursor) => { cursor.x = xPos; });
      }
    }),
    t: searchMotion((ch) => {
      const offset = window.getLines()[window.cursor.y]
        // We don't want to find the current character, so a +1 offset here
        .substr(window.cursor.x + 1)
        .indexOf(ch);
      if (offset > 0) {
        window.cursor.moveRight(offset);
      }
    }),
    T: searchMotion((ch) => {
      let xPos = window.getLines()[window.cursor.y]
        .substr(0, window.cursor.x)
        .lastIndexOf(ch);
      if (xPos !== -1) {
        xPos += 1;
        window.cursor.update((cursor) => { cursor.x = xPos; });
      }
    }),
  };
};
