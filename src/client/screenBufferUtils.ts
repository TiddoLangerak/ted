import type { Line, Buffer, Modifier } from './screen';

export type FillLineOpts = {
  modifiers: Set<Modifier>,
  filler: string,
  fillerModifiers: Set<Modifier>
};
/**
 * Fills a line with some text with a constant modifier. It'll padd the rest of the line
 * with the filler.
 *
 * If the text is longer than the line then the text will be cut off
 */
export function fillLine(line: Line, text: string, {
    modifiers = new Set(),
    filler = ' ',
    fillerModifiers = new Set(),
  }: $Shape<FillLineOpts> = {}) {
  const numChars = Math.min(line.length, text.length);
  let i = 0;
  for (; i < numChars; i += 1) {
    line[i].ch = text.substr(i, 1);
    line[i].modifiers = modifiers;
  }
  for (; i < line.length; i += 1) {
    line[i].ch = filler;
    line[i].modifiers = fillerModifiers;
  }
  return line;
}

/**
 * Creates a fixed-length text segment.
 */
export function fixedLength(text: string, length: number, opts: $Shape<FillLineOpts>) {
  const line = Array.from(new Array(length), () => ({ ch: ' ', modifiers: new Set() }));
  return fillLine(line, text, opts);
}

/**
 * Creates a styled segment
 */
export function createSegment(text: string, modifiers: Set<Modifier> = new Set()) {
  return text.split('')
    .map(ch => ({ ch, modifiers }));
}

/**
 * Copies the content of one buffer into another one.
 *
 * The main goal for this function is to allow drawables to construct buffers from scratch, and then
 * write the buffers into the passed in buffer.
 */
export function writeIntoBuffer(src: Buffer, target: Buffer) {
  src
    // Make sure we don't overflow the target
    .slice(0, target.length)
    .forEach((line, lineIdx) => {
      line
      // Again, prevent overflowing
        .slice(0, target[lineIdx].length)
        .forEach((cell, colIdx) => {
          target[lineIdx][colIdx] = cell;
        });
    });
}
