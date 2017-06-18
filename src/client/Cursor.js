/* @flow */
import styles from 'ansi-styles';
import { draw, registerDrawable } from './screen';
import { stdout } from './stdio';
import type { Window } from './window';

export const anchors = {
  EOL: '$',
};

export type BufferCoordinates = {
  x: number,
  y: number
};

export type Cursor = BufferCoordinates & {
  eol: boolean,
  update(Cursor => mixed) : void,
  moveTo(x: number, y: number) : void,
  moveLeft(amount?: number) : void,
  moveRight(amount?: number) : void,
  moveUp(amount?: number) : void,
  moveDown(amount?: number) : void,
  moveToStartOfLine() : void,
  moveToEOL() : void
}

/**
 * Gets the screen coordinates for a given buffer coordinate
 * The buffer coordinate should specify an {x, y} pair, corresponding to the xth character
 * on the yth line. The screen coordinate will be a  {column, row} pair.
 */
function getScreenCoordinates(window: Window, bufferCoordinates: BufferCoordinates) {
  const screenCoordinates = {
    column: bufferCoordinates.x,
    row: bufferCoordinates.y - window.bufferOffset,
  };
  const leadingTabs = window.getLines()[bufferCoordinates.y]
    .substr(0, bufferCoordinates.x)
    .split('\t')
    .length - 1;

  const columnOffset = leadingTabs * (window.tabWidth - 1);
  screenCoordinates.column += columnOffset;
  return screenCoordinates;
}

export default function createCursor(window: Window): Cursor {
  const cursor = {
    eol: false,
    x: 0,
    y: 0,
    update(updateFunc: (Cursor) => mixed) {
      updateFunc(cursor);
      // Note: both for y and x the min call must be done before the max call, since
      // it is possible that a negative number comes out of the Math.min call
      // (when rows or cols = 0)
      cursor.y = Math.min(
                          window.getLines().length - 1,
                          cursor.y,
      );
      cursor.y = Math.max(0, cursor.y);

      // We can't do math with anchor points, so we need to check if we actually have a number
      if (!cursor.eol) {
        cursor.x = Math.min(
                            window.lineLength(cursor.y),
                            cursor.x,
        );
        cursor.x = Math.max(0, cursor.x);
        // Auto anchor (exclude 0 for empty lines)
        if (cursor.x !== 0 && cursor.x === window.lineLength(cursor.y)) {
          cursor.eol = true;
        }
      } else {
        cursor.x = window.lineLength(cursor.y);
      }

      // TODO: get this from somewhere
      const windowHeight = stdout.getRows() - 2;
      // Scroll
      if (cursor.y - window.bufferOffset >= windowHeight - window.cursorPadding) {
        window.bufferOffset = cursor.y - (windowHeight + window.cursorPadding + 1);
      } else if (cursor.y - window.bufferOffset - window.cursorPadding < 0) {
        window.bufferOffset = Math.max(0, cursor.y - window.cursorPadding);
      }
      draw();
    },
    isAt(point: number) {
      return cursor.x === point;
    },
    moveTo(y: number, x: number) {
      cursor.update((cur) => {
        cur.x = x;
        cur.y = y;
        cur.eol = false;
      });
    },
    moveLeft(amount: number = 1) {
      cursor.update((cur) => {
        cur.eol = false;
        cur.x -= amount;
      });
    },
    moveRight(amount: number = 1) {
      cursor.update((cur) => { cur.x += amount; });
    },
    moveUp(amount: number = 1) {
      cursor.update((cur) => { cur.y -= amount; });
    },
    moveDown(amount: number = 1) {
      cursor.update((cur) => { cur.y += amount; });
    },
    moveToEOL() {
      cursor.update((cur) => { cur.eol = true; });
    },
    moveToStartOfLine() {
      cursor.update((cur) => { cur.x = 0; });
    },
  };

  registerDrawable('CURSOR', (buffer) => {
    const cursorPos = getScreenCoordinates(window, cursor);
    // We need to copy the modifiers since it may be shared with other characters
    const mods = new Set(buffer[cursorPos.row][cursorPos.column].modifiers);
    mods.add(styles.bgWhite);
    mods.add(styles.black);
    buffer[cursorPos.row][cursorPos.column].modifiers = mods;
  });
  return cursor;
}
