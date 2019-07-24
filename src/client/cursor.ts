import styles from "ansi-styles";
import { Window } from "./window";
import log from './fileLogger';
import { Screen } from "./screen";

export const anchors = {
  EOL: "$"
};

export interface BufferCoordinates {
  x: number;
  y: number;
};

export class Cursor implements BufferCoordinates {
  private window: Window;
  private screen: Screen;
  eol= false;
  x= 0;
  y= 0;
  constructor(window: Window, screen: Screen) {
    this.window = window;
    this.screen = screen;
  }
  update(updateFunc: (cursor: Cursor) => unknown) {
    log(`Old y: ${this.y}`);
    updateFunc(this);
    // Note: both for y and x the min call must be done before the max call, since
    // it is possible that a negative number comes out of the Math.min call
    // (when rows or cols = 0)
    log(`New y: ${this.y}. Window lines: ${this.window.getLines().length}`);
    this.y = Math.min(this.window.getLines().length - 1, this.y);
    log(`Adjusted y: ${this.y}`);
    this.y = Math.max(0, this.y);

    // We can't do math with anchor points, so we need to check if we actually have a number
    if (!this.eol) {
      this.x = Math.min(this.window.lineLength(this.y), this.x);
      this.x = Math.max(0, this.x);
      // Auto anchor (exclude 0 for empty lines)
      if (this.x !== 0 && this.x === this.window.lineLength(this.y)) {
        this.eol = true;
      }
    } else {
      this.x = this.window.lineLength(this.y);
    }

    // TODO: get this from somewhere
    const windowHeight = this.window.getHeight(); //stdout.getRows() - 2;
    // Scroll
    if (
      this.y - this.window.bufferOffset >=
      windowHeight - this.window.cursorPadding
    ) {
      log("Scrolling");
      this.window.bufferOffset =
        this.y - (windowHeight + this.window.cursorPadding + 1);
    } else if (this.y - this.window.bufferOffset - this.window.cursorPadding < 0) {
      this.window.bufferOffset = Math.max(0, this.y - this.window.cursorPadding);
    }
    this.screen.draw();
  }
  isAt(point: number) {
    return this.x === point;
  }
  moveTo(y: number, x: number) {
    this.update(cur => {
      cur.x = x;
      cur.y = y;
      cur.eol = false;
    });
  }
  moveLeft(amount: number = 1) {
    this.update(cur => {
      cur.eol = false;
      cur.x -= amount;
    });
  }
  moveRight(amount: number = 1) {
    this.update(cur => {
      cur.x += amount;
    });
  }
  moveUp(amount: number = 1) {
    this.update(cur => {
      cur.y -= amount;
    });
  }
  moveDown(amount: number = 1) {
    this.update(cur => {
      cur.y += amount;
    });
  }
  moveToEOL() {
    this.update(cur => {
      cur.eol = true;
    });
  }
  moveToStartOfLine() {
    this.update(cur => {
      cur.x = 0;
    });
  }
}

export default function createCursor(window: Window, screen: Screen): Cursor {
  const cursor = new Cursor(window, screen);

  screen.registerDrawable("CURSOR", buffer => {
    const cursorPos = window.getScreenCoordinates(cursor);
    log(`Cursor coordinates: ${cursor.y},${cursor.x}. Screen coordinates: ${cursorPos.row},${cursorPos.column}. Buffer offset: ${window.bufferOffset}`);
    // We need to copy the modifiers since it may be shared with other characters
    const mods = new Set(buffer[cursorPos.row][cursorPos.column].modifiers);
    mods.add(styles.bgWhite);
    mods.add(styles.black);
    buffer[cursorPos.row][cursorPos.column].modifiers = mods;
  });
  return cursor;
}
