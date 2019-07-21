import util from "util";
import styles from "ansi-styles";
import { registerDrawable, draw } from "./screen";
import { fillLine } from "./screenBufferUtils";
import { LogLevel } from "../server/log";
import { EscapeCode } from "ansi-styles/escape-code";

interface Log {
  msg: string;
  type: LogLevel;
}

const logs: Log[] = [];

function storeLog(msg: string, type: LogLevel) {
  if (typeof msg !== "string") {
    // eslint-disable-next-line no-param-reassign
    msg = util.inspect(msg);
  }
  msg.split("\n").forEach(line => logs.push({ msg: line, type }));
}

export function log(...msgs: string[]) {
  msgs.forEach(msg => storeLog(msg, "log"));
  draw();
}

export function error(...msgs: string[]) {
  msgs.forEach(msg => storeLog(msg, "error"));
}

export function clearLog() {
  logs.splice(0, logs.length);
  draw();
}

const logBg = styles.bgBlack;
type Modifiers = {
  [K in LogLevel]?: Set<EscapeCode.CodePair>;
};

const modifiers: Modifiers = {
  log: new Set([logBg]),
  error: new Set([styles.red, logBg])
};
const defaultModifiers = new Set([logBg]);

registerDrawable("LOG", buffer => {
  if (logs.length) {
    // -1 because of the header
    const virtualStart = buffer.length - logs.length - 1;
    const start = Math.max(0, virtualStart);
    fillLine(buffer[start], "---LOG---", {
      modifiers: defaultModifiers,
      fillerModifiers: defaultModifiers
    });
    logs
      .filter(
        (msg, idx) =>
          // We need to filter out those logs that are drawn above the visible viewport.
          virtualStart + 1 + idx > 0
      )
      .forEach((msg, idx) => {
        fillLine(buffer[start + 1 + idx], msg.msg, {
          modifiers: modifiers[msg.type],
          fillerModifiers: defaultModifiers
        });
      });
  }
});
