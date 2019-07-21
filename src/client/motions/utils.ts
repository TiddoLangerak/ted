// eslint-disable-next-line import/prefer-default-export
import { Key } from "../keyboardProcessor";
export function isCharKey(ch: string, key: Key) {
  let isChar = true;
  if (!ch ||
    (key && (key.ctrl || key.meta))
  ) {
    isChar = false;
  }
  return isChar;
}

