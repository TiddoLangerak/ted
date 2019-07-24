import keypress from "keypress";
import { StdReadable } from "./stdio";

export interface Key {
  ctrl: boolean;
  meta: boolean;
  sequence: string;
}

/**
 * Returns a ctrl+<char> unicode value for a given <char>
 *
 * This does NOT compose with other functions.
 */
export function ctrl(c: string) {
  const charNum = c.charCodeAt(0) - "a".charCodeAt(0);
  if (charNum > 25) {
    throw new Error("ctrl modifier can only be used for lowercase letters");
  }
  // See http://unicodelookup.com/#ctrl
  return String.fromCharCode(charNum + 1);
}

/**
 * Returns a alt+<char> unicode value for a given <char>
 *
 * This does NOT compose with other functions.
 */
export function alt(c: string) {
  return `\u001b${c}`;
}

interface KeyPress {
  ch: string;
  key: Key;
}

type KeyPressCallback = (keyPress: KeyPress) => unknown;

const presses: KeyPress[] = [];
const callbacks: KeyPressCallback[] = [];

function flushQueue() {
  while (callbacks.length && presses.length) {
    callbacks.pop()!(presses.pop()!);
  }
}

/**
 * Gets the next keypress, and remove it from the queue.
 *
 * If a keypress is already queued then this function will return it directly (sync).
 * If it isn't already queued, then it will return a promise that resolves to
 * the next unhandled keypress.
 *
 * Note that calls to next & peek are queued. A keypress will always resolve the
 * first scheduled call to next, and any calls to peek that were scheduled *before*
 * the first `next`.
 */
export function next(): Promise<KeyPress> {
  if (presses.length) {
    return Promise.resolve(presses.pop()!);
  }
  return new Promise(resolve => callbacks.unshift(resolve));
}

/**
 * Gets the next keypress without removing it from the queue.
 * If a keypress is already queued then this function will return it directly (sync).
 * If it isn't already queued, then it will return a promise that resolves to
 * the next unhandled keypress.
 *
 * Note that calls to next & peek are queued. A keypress will always resolve the
 * first scheduled call to next, and any calls to peek that were scheduled *before*
 * the first `next`.
 */
export function peek(): Promise<KeyPress> {
  if (presses.length) {
    return Promise.resolve(presses[presses.length - 1]);
  }
  return new Promise(resolve => {
    callbacks.unshift(res => {
      presses.push(res);
      resolve(res);
    });
  });
}

function keyProcessor(ch: string, key: Key) {
  presses.unshift({ ch, key });
  flushQueue();
}

export const keys = {
  BACKSPACE: "\u007f",
  ESCAPE: "\u001b"
};

// TODO: remove any type when flow has proper support for symbols
export const other: unique symbol = Symbol("other");

/**
 * Starts the keyboard processing.
 *
 * Bindings should be an object that maps (unicode) chars to actions. Note that
 * unicode also has codepoints for things like ctrl+a, which will be understood
 * by these bindings as well.
 *
 * An action may return a new set of bindings which will replace the current set of bindings
 */
export default function start(stdin: StdReadable) {
  keypress(stdin);
  stdin.on("keypress", keyProcessor);
}
