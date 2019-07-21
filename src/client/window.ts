import { draw, registerDrawable } from './screen';
import { fillLine } from './screenBufferUtils';
import { applyDiff, diffTypes, extractText } from '../diff';
import createCursor from './Cursor';
import { Cursor } from './Cursor';
import { Loc, Diff } from '../diff';

export type Window = {
  getContent() : string,
  setContent(string) : void,
  getLines() : string[],
  getCurrentLine() : string,
  lineLength(lineNum: number) : number,
  getText(from: Loc, to: Loc) : string,
  processDiff(diff: Diff) : void,
  file: string,
  isDirty: boolean,
  bufferOffset: number,
  tabWidth: number,
  cursorPadding: number,
  cursor: Cursor
}

function pointInRange(from, to, point) {
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


export default function (contentArg: string = ''): Window {
  let content = contentArg;
  let lines = content.split('\n');
  const window = {};
  window.getContent = () => content;
  window.setContent = (newContent) => {
    content = newContent;
    lines = content.split('\n');
    draw();
  };
  window.getLines = () => Array.of(...lines);
  window.getCurrentLine = () => lines[window.cursor.y];
  window.file = '';
  window.getText = (from, to) => extractText(lines, from, to);
  window.cursor = createCursor(window);
  window.lineLength = (line) => {
    if (lines.length <= line) {
      return 0;
    }
    return lines[line].length;
  };
  window.isDirty = false;
  // nr of lines that the cursor must stay from the edge
  window.cursorPadding = 3;
  window.bufferOffset = 0;
  window.processDiff = (diff) => {
    // We can't update the cursor position directly. Doing so might move the cursor to a position
    // that does not yet exists, or update anchors incorrectly. Likewise, we can't apply the diff
    // first either. Doing so makes it hard to do certain checks in cursor updates
    // (e.g. pointInRange will fail when the cursor is at an anchor position).
    // To get around this we first determine where we want to move the cursor to after the update.
    // Then we can apply the update safely, and lastly we can update the cursor.
    const newCursorPos = { x: window.cursor.x, y: window.cursor.y };
    switch (diff.type) {
      case diffTypes.DELETE:
        if (pointInRange({ x: diff.from.column, y: diff.from.line },
                         { x: diff.to.column, y: diff.to.line },
                         window.cursor)) {
          newCursorPos.x = diff.from.column;
          newCursorPos.y = diff.from.line;
        } else if (diff.to.line < window.cursor.y) {
          newCursorPos.y -= (diff.to.line - diff.from.line);
        } else if (diff.to.line === window.cursor.y && diff.to.column < window.cursor.x) {
          if (diff.to.line === diff.from.line) {
            newCursorPos.x -= (diff.to.column - diff.from.column);
          } else {
            newCursorPos.x -= diff.to.column;
          }
        }
        break;
      case diffTypes.INSERT:
        if (diff.line === window.cursor.y && diff.column <= window.cursor.x) {
          const newLines = diff.text.split('\n');
          newCursorPos.y += newLines.length - 1;
          newCursorPos.x += newLines.pop().length;
        } else if (diff.line < window.cursor.y) {
          newCursorPos.y += diff.text.split('\n').length - 1;
        }
        break;
      default :
        throw new Error('Unkown diff type');
    }
    applyDiff(lines, diff);
    window.cursor.update((cursor) => {
      cursor.y = newCursorPos.y;
      cursor.x = newCursorPos.x;
    });
    draw();
  };
  window.tabWidth = 2;


  /**
   * Not all characters can be properly displayed by the terminal.
   * This function normalizes the text in such a way that it looks like it should.
   *
   * Currently it:
   * 1. Replaces tabs with spaces
   * 2. Replaces weird line endings with unix-style line endings
   */
  function normalizeText(input) {
    let text = input;
    // 1. replace tabs
    const visualTab = Array.from(new Array(window.tabWidth), () => ' ').join('');
    text = text.replace(/\t/g, visualTab);

    // 2. replace line endings
    text = text.replace(/\r\n?/g, '\n');

    return text;
  }


  registerDrawable('CONTENT', (buffer) => {
    lines.slice(window.bufferOffset, window.bufferOffset + buffer.length)
      .forEach((line, idx) => fillLine(buffer[idx], normalizeText(line)));
  });

  return window;
}
