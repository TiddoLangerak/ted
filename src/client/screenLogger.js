/* @flow */
import util from 'util';
import styles from 'ansi-styles';
import { registerDrawable, draw } from './screen';
import { fillLine } from './screenBufferUtils';

const logs = [];

function storeLog(msg, type) {
  if (typeof msg !== 'string') {
    // eslint-disable-next-line no-param-reassign
    msg = util.inspect(msg);
  }
  msg.split('\n').forEach(line => logs.push({ msg: line, type }));
}

export function log(...msgs: string[]) {
  msgs.forEach(msg => storeLog(msg, 'log'));
  draw();
}

export function error(...msgs: string[]) {
  msgs.forEach(msg => storeLog(msg, 'error'));
}

export function clearLog() {
  logs.splice(0, logs.length);
  draw();
}


const logBg = styles.bgBlack;
const modifiers = {
  default: new Set([logBg]),
  log: new Set([logBg]),
  error: new Set([styles.red, logBg]),
};

registerDrawable('LOG', (buffer) => {
  if (logs.length) {
    // -1 because of the header
    const virtualStart = buffer.length - logs.length - 1;
    const start = Math.max(0, virtualStart);
    fillLine(buffer[start], '---LOG---', { modifiers: modifiers.default, fillerModifiers: modifiers.default });
    logs
      .filter((msg, idx) =>
        // We need to filter out those logs that are drawn above the visible viewport.
        virtualStart + 1 + idx > 0,
      )
      .forEach((msg, idx) => {
        fillLine(buffer[start + 1 + idx],
          msg.msg,
          { modifiers: modifiers[msg.type], fillerModifiers: modifiers.default },
        );
      });
  }
});

