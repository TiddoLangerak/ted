import { draw, registerDrawable } from "./screen";
import { fillLine } from "./screenBufferUtils";
import { applyDiff, DiffType, extractText, Loc, Diff } from "../diff";
import createCursor, { Cursor } from "./cursor";
import { assertUnreachable } from "../assertUnreachable";

export class Window {
  private content: string;
  private lines: string[];
  private cursor: Cursor;
  file = "";
  isDirty = false;
  cursorPadding= 3;
  // nr of lines that the cursor must stay from the edge
  bufferOffset= 0;
  tabWidth= 2;
  constructor(content: string) {
    this.content = content;
    this.lines = content.split("\n");
    this.cursor = createCursor(this);
  }
  getContent(){
    return this.content;
  }
  setContent(newContent: string) {
    this.content = newContent;
    this.lines = this.content.split("\n");
    draw();
  }
  getLines() {
    return [...this.lines];
  }
  getCurrentLine() {
    return this.lines[this.getCursor().y];
  }
  getText(from: Loc, to: Loc){
    return extractText(this.lines, from, to);
  }
  getCursor(){
    return this.cursor;
  }
  lineLength(line: number) {
    if (this.lines.length <= line) {
      return 0;
    }
    return this.lines[line].length;
  }
  processDiff(diff: Diff) {
    const cursor = this.getCursor();
    // We can't update the cursor position directly. Doing so might move the cursor to a position
    // that does not yet exists, or update anchors incorrectly. Likewise, we can't apply the diff
    // first either. Doing so makes it hard to do certain checks in cursor updates
    // (e.g. pointInRange will fail when the cursor is at an anchor position).
    // To get around this we first determine where we want to move the cursor to after the update.
    // Then we can apply the update safely, and lastly we can update the cursor.
    const newCursorPos = { x: cursor.x, y: cursor.y };
    switch (diff.type) {
      case DiffType.DELETE:
        if (
          pointInRange(
            { x: diff.from.column, y: diff.from.line },
            { x: diff.to.column, y: diff.to.line },
            cursor
          )
        ) {
          newCursorPos.x = diff.from.column;
          newCursorPos.y = diff.from.line;
        } else if (diff.to.line < cursor.y) {
          newCursorPos.y -= diff.to.line - diff.from.line;
        } else if (diff.to.line === cursor.y && diff.to.column < cursor.x) {
          if (diff.to.line === diff.from.line) {
            newCursorPos.x -= diff.to.column - diff.from.column;
          } else {
            newCursorPos.x -= diff.to.column;
          }
        }
        break;
      case DiffType.INSERT:
        if (diff.line === cursor.y && diff.column <= cursor.x) {
          const newLines = diff.text.split("\n");
          newCursorPos.y += newLines.length - 1;
          newCursorPos.x += newLines.pop()!.length;
        } else if (diff.line < cursor.y) {
          newCursorPos.y += diff.text.split("\n").length - 1;
        }
        break;
      default:
        assertUnreachable(diff);
    }
    applyDiff(this.lines, diff);
    cursor.update(cursor => {
      cursor.y = newCursorPos.y;
      cursor.x = newCursorPos.x;
    });
    draw();
  };
}

interface Point {
  x: number;
  y: number;
}

/**
 * Not all characters can be properly displayed by the terminal.
 * This function normalizes the text in such a way that it looks like it should.
 *
 * Currently it:
 * 1. Replaces tabs with spaces
 * 2. Replaces weird line endings with unix-style line endings
 */
function normalizeText(input: string, tabWidth: number) {
  let text = input;
  // 1. replace tabs
  const visualTab = Array.from(new Array(tabWidth), () => " ").join("");
  text = text.replace(/\t/g, visualTab);

  // 2. replace line endings
  text = text.replace(/\r\n?/g, "\n");

  return text;
}

function pointInRange(from: Point, to: Point, point: Point): boolean {
  if (point.y < from.y) {
    return false;
  }
  if (point.y > to.y) {
    return false;
  }
  if (point.y === from.y && point.x < from.x) {
    return false;
  }
  if (point.y === to.y && point.x > to.x) {
    return false;
  }
  return true;
}

export default function createWindow(contentArg: string = ""): Window {
  const window: Window = new Window(contentArg);

  registerDrawable("CONTENT", buffer => {
    window.getLines()
      .slice(window.bufferOffset, window.bufferOffset + buffer.length)
      .forEach((line, idx) =>
        fillLine(buffer[idx], normalizeText(line, window.tabWidth))
      );
  });

  return window;
}
