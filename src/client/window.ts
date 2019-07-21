import { draw, registerDrawable } from './screen';
import { fillLine } from './screenBufferUtils';
import { applyDiff, DiffType, extractText } from '../diff';
import createCursor from './Cursor';
import { Cursor } from './Cursor';
import { Loc, Diff } from '../diff';
import { assertUnreachable } from "../assertUnreachable";

export interface Window {
  getContent() : string;
  setContent(content: string) : void;
  getLines() : string[];
  getCurrentLine() : string;
  lineLength(lineNum: number) : number;
  getText(from: Loc, to: Loc) : string;
  processDiff(diff: Diff) : void;
  file: string;
  isDirty: boolean;
  bufferOffset: number;
  tabWidth: number;
  cursorPadding: number;
  getCursor(): Cursor
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
  const visualTab = Array.from(new Array(tabWidth), () => ' ').join('');
  text = text.replace(/\t/g, visualTab);

  // 2. replace line endings
  text = text.replace(/\r\n?/g, '\n');

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


export default function createWindow(contentArg: string = ''): Window {
  let content = contentArg;
  let lines = content.split('\n');
  let cursor: Cursor | undefined;
  function getCursor(): Cursor {
    if (!cursor) {
      cursor = createCursor(window);
    }
    return cursor;
  }

  const window : Window = {
    getContent : () => content,
    setContent : (newContent) => {
      content = newContent;
      lines = content.split('\n');
      draw();
    },
    getLines : () => Array.of(...lines),
    getCurrentLine : () => lines[window.getCursor().y],
    file : '',
    getText : (from, to) => extractText(lines, from, to),
    getCursor,
    lineLength : (line) => {
      if (lines.length <= line) {
        return 0;
      }
      return lines[line].length;
    },
    isDirty : false,
    // nr of lines that the cursor must stay from the edge
    cursorPadding : 3,
    bufferOffset : 0,
    processDiff : (diff) => {
      const cursor = window.getCursor();
      // We can't update the cursor position directly. Doing so might move the cursor to a position
      // that does not yet exists, or update anchors incorrectly. Likewise, we can't apply the diff
      // first either. Doing so makes it hard to do certain checks in cursor updates
      // (e.g. pointInRange will fail when the cursor is at an anchor position).
      // To get around this we first determine where we want to move the cursor to after the update.
      // Then we can apply the update safely, and lastly we can update the cursor.
      const newCursorPos = { x: cursor.x, y: cursor.y };
      switch (diff.type) {
        case DiffType.DELETE:
          if (pointInRange({ x: diff.from.column, y: diff.from.line },
            { x: diff.to.column, y: diff.to.line },
            cursor)) {
            newCursorPos.x = diff.from.column;
            newCursorPos.y = diff.from.line;
          } else if (diff.to.line < cursor.y) {
            newCursorPos.y -= (diff.to.line - diff.from.line);
          } else if (diff.to.line === cursor.y && diff.to.column < cursor.x) {
            if (diff.to.line === diff.from.line) {
              newCursorPos.x -= (diff.to.column - diff.from.column);
            } else {
              newCursorPos.x -= diff.to.column;
            }
          }
          break;
        case DiffType.INSERT:
          if (diff.line === cursor.y && diff.column <= cursor.x) {
            const newLines = diff.text.split('\n');
            newCursorPos.y += newLines.length - 1;
            newCursorPos.x += newLines.pop()!.length;
          } else if (diff.line < cursor.y) {
            newCursorPos.y += diff.text.split('\n').length - 1;
          }
          break;
        default :
          assertUnreachable(diff);
      }
      applyDiff(lines, diff);
      cursor.update((cursor) => {
        cursor.y = newCursorPos.y;
        cursor.x = newCursorPos.x;
      });
      draw();
    },
    tabWidth : 2
  };


  registerDrawable('CONTENT', (buffer) => {
    lines.slice(window.bufferOffset, window.bufferOffset + buffer.length)
      .forEach((line, idx) => fillLine(buffer[idx], normalizeText(line, window.tabWidth)));
  });

  return window;
}
