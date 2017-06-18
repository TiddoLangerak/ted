/* @flow */
import { wordCharacter, not, compilePattern, oneOf } from '../../patterns';
import type { State } from '../';

export default ({ window }: State) => {
  /**
   * Jump over a match.
   *
   * If jumpOverLastChar is true then we will jump past the match, if it is false we'll jump
   * onto the last character of the match.
   *
   * If backwards is set we search in reverse
   */
  function jumpOverMatch(regexp: RegExp, jumpOverLastChar = true, reverse = false) {
    let remainder;
    if (reverse) {
      remainder = window.getCurrentLine().substr(0, window.cursor.x)
        .split('')
        .reverse()
        .join('');
    } else {
      remainder = window.getCurrentLine().substr(window.cursor.x + 1);
    }

    const match = regexp.exec(remainder);
    if (match) {
      const extraOffset = jumpOverLastChar ? 1 : 0;
      const totalOffset = match[0].length + extraOffset;
      if (reverse) {
        window.cursor.moveLeft(totalOffset);
      } else {
        window.cursor.moveRight(totalOffset);
      }
    }
  }
  const nonWordCharacter = oneOf(not(wordCharacter), '$');
  const endOfWord = compilePattern(`^${nonWordCharacter}*${wordCharacter}+`);
  const nextWord = compilePattern(`^${wordCharacter}*${nonWordCharacter}+${wordCharacter}`);
  const endOfCharSequence = compilePattern('^\\s*\\S+');
  const nextCharSequence = compilePattern('^\\S*\\s+\\S');

  return {
    h: () => window.cursor.moveLeft(),
    l: () => window.cursor.moveRight(),
    j: () => window.cursor.moveDown(),
    k: () => window.cursor.moveUp(),
    $: window.cursor.moveToEOL,
    G: () => window.cursor.update((cursor) => { cursor.y = window.getLines().length - 1; }),
    gg: () => window.cursor.update((cursor) => { cursor.y = 0; }),
    '0': () => window.cursor.moveTo(window.cursor.y, 0),
    '^': () => {
      const nonSpaceMatch = /\S/.exec(window.getCurrentLine());
      if (nonSpaceMatch) {
        window.cursor.moveTo(window.cursor.y, nonSpaceMatch.index);
      } else {
        window.cursor.moveToEOL();
      }
    },
    e: () => jumpOverMatch(endOfWord, false),
    E: () => jumpOverMatch(endOfCharSequence, false),
    w: () => jumpOverMatch(nextWord, false),
    W: () => jumpOverMatch(nextCharSequence, false),
    b: () => jumpOverMatch(endOfWord, false, true),
    B: () => jumpOverMatch(endOfCharSequence, false, true),
  };
};
