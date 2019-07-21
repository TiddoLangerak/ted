/* @flow */

// eslint-disable-next-line import/prefer-default-export
export function isCharKey(ch: string, key: string) {
  let isChar = true;
  if (!ch ||
    (key && (key.ctrl || key.meta))
  ) {
    isChar = false;
  }
  return isChar;
}

