import { other, Key } from '../keyboardProcessor';
import { isCharKey } from './utils';
import { State } from '../';

export default ({ window }: State) => {
  const cursor = window.getCursor();
  function searchMotion(searchFunc: (char: string) => unknown) {
    return {
      [other]: (ch: string, key: Key) => {
        if (isCharKey(ch, key)) {
          searchFunc(ch);
        }
      },
    };
  }
  return {
    f: searchMotion((ch) => {
      const offset = window.getLines()[cursor.y]
        // We don't want to find the current character, so a +1 offset here
        .substr(cursor.x + 1)
        .indexOf(ch) + 1; // +1 to compensate for the +1 above
      if (offset >= 0) {
        cursor.moveRight(offset);
      }
    }),
    F: searchMotion((ch) => {
      const xPos = window.getLines()[cursor.y]
        .substr(0, cursor.x)
        .lastIndexOf(ch);
      if (xPos >= 0) {
        cursor.update((cursor) => { cursor.x = xPos; });
      }
    }),
    t: searchMotion((ch) => {
      const offset = window.getLines()[cursor.y]
        // We don't want to find the current character, so a +1 offset here
        .substr(cursor.x + 1)
        .indexOf(ch);
      if (offset > 0) {
        cursor.moveRight(offset);
      }
    }),
    T: searchMotion((ch) => {
      let xPos = window.getLines()[cursor.y]
        .substr(0, cursor.x)
        .lastIndexOf(ch);
      if (xPos !== -1) {
        xPos += 1;
        cursor.update((cursor) => { cursor.x = xPos; });
      }
    }),
  };
};
