import { assertUnreachable } from "./assertUnreachable";

export enum DiffType {
  INSERT = "insert",
  DELETE = "delete"
}

export type Loc = {
  line: number;
  column: number;
};

export type InsertDiff = {
  type: DiffType.INSERT;
  text: string;
} & Loc;
export type DeleteDiff = {
  type: DiffType.DELETE;
  from: Loc;
  to: Loc;
  text: string;
};

export type Diff = InsertDiff | DeleteDiff;

export function invertDiff(diff: Diff): Diff {
  switch (diff.type) {
    case DiffType.INSERT: {
      const lines = diff.text.split("\n");
      const from = { line: diff.line, column: diff.column };
      const to =
        lines.length === 1
          ? { line: diff.line, column: diff.column + lines[0].length }
          : {
              line: diff.line + (lines.length - 1),
              column: lines[lines.length - 1].length
            };

      return {
        type: DiffType.DELETE,
        from,
        to,
        text: diff.text
      };
    }
    case DiffType.DELETE: {
      return {
        type: DiffType.INSERT,
        line: diff.from.line,
        column: diff.from.column,
        text: diff.text
      };
    }
    default:
      return assertUnreachable(diff);
  }
}

export function extractText(lines: string[], from: Loc, to: Loc): string {
  // First get the relevant lines
  const range = lines.slice(from.line, to.line + 1);
  // then slice of the unecessary columns from the beginning and the end
  // Note that we first process the end: doing so keeps the index for the beginning unchanged,
  // even if `from` and `to` are on the same line. (If we were to cut of the beginning first we
  // would have to update the to column if it was on the same line as from.)
  range[range.length - 1] = range[range.length - 1].substr(0, to.column);
  range[0] = range[0].substr(from.column);
  return range.join("\n");
}

/**
 * Apply a diff to some text.
 *
 * The input can be provided both as an array of lines or as a string value. If an array of lines
 * is provided then it will be updated in place. In all cases the new string will be returned.
 */
export function applyDiff(input: string | string[], diff: Diff) {
  let lines: string[];
  if (typeof input === "string") {
    lines = input.split("\n");
  } else {
    lines = input;
  }

  switch (diff.type) {
    case DiffType.INSERT: {
      // We'll create an empty line when text is inserted below the last line
      if (diff.line === lines.length) {
        console.log("linepush");
        lines.push("");
      }
      const currentLine = lines[diff.line];
      const newText =
        currentLine.substr(0, diff.column) +
        diff.text +
        currentLine.substr(diff.column);
      // The inserted text can contain newlines, so we may have to replace a
      // single line with multiple new ones
      const newLines = newText.split("\n");
      lines.splice(diff.line, 1, ...newLines);
      break;
    }
    case DiffType.DELETE: {
      // We copy the from and to such that we can alter them at will
      const from = Object.assign({}, diff.from);
      const to = Object.assign({}, diff.to);
      // First check if the text we're about to remove corresponds with the text given in the diff
      const toRemove = extractText(lines, from, to);
      if (toRemove !== diff.text) {
        throw new Error(
          `Text to remove does not match actual text. To remove: '${diff.text}' actual: '${toRemove}'`
        );
      }
      // When to is placed just below the last character we will wrap it back to the last column of
      // the text. Allowing the to to be placed just beyond the content makes it much easier to
      // write generalized code, otherwise many line based operators would need to special case
      // last line.
      if (to.line === lines.length && to.column === 0) {
        to.line = lines.length - 1;
        to.column = lines[to.line].length;
      }
      // We are replacing all affected lines in the deletion with one new line. The newline is
      // the 'prefix' of the start line + the 'postfix' of the end-line, i.e. the parts of
      // the lines in the range that we need to keep.
      const newLine =
        lines[from.line].substr(0, from.column) +
        lines[to.line].substr(to.column);
      const linesToReplace = diff.to.line - diff.from.line + 1;
      lines.splice(diff.from.line, linesToReplace, newLine);
      break;
    }
    default:
      return assertUnreachable(diff);
  }

  return lines.join("\n");
}
