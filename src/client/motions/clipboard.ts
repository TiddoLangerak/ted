import { copy, paste } from "copy-paste";
import { DiffType, InsertDiff } from "../../diff";
import promisify from "../../promisify";
import { State } from "../state";

export default ({ window, contentManager }: State) => {
  const cursor = window.getCursor();
  async function processPaste(beforeCursor = false) {
    const text: string = await promisify(cb => paste(cb));
    if (!beforeCursor) {
      // When we want to paste after the cursor we just move our cursor one place to the right
      // and then paste before it
      cursor.moveRight();
    }

    // When we paste whole lines we don't want to paste them in the middle of the current line.
    // Instead we will make sure they end up on their own lines by moving the cursor to the start
    // of the line (or next line when we want to paste after)
    const isBlock = text.charAt(text.length - 1) === "\n";
    const pasteAtEnd = isBlock && window.getLines().length === cursor.y + 1;
    if (isBlock) {
      cursor.moveToStartOfLine();
      if (!beforeCursor) {
        cursor.moveDown();
      }
    }

    const diff: InsertDiff = {
      type: DiffType.INSERT,
      line: cursor.y,
      column: cursor.x,
      text
    };
    if (pasteAtEnd) {
      diff.line = window.getLines().length;
      // We don't want the trailing newline when pasting at the end, so we cut it off
      diff.text = diff.text.slice(0, -1);
    }

    contentManager.processClientDiff(diff);
    // Select the last character of the paste (as if we had just inserted it manually and went back
    // d
    // to normal mode)
    cursor.moveLeft();

    // In block mode we want to select the first character of the pasted text instead
    if (isBlock) {
      cursor.update(cursor => {
        cursor.x = diff.column;
        cursor.y = diff.line;
      });
    }
  }
  return {
    yy: () => {
      const line = window.getLines()[cursor.y];
      copy(`${line}\n`);
    },
    P: () => {
      processPaste(true);
    },
    p: () => {
      processPaste();
    }
  };
};
