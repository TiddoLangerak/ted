import keypress from 'keypress';
import { stdin } from './stdio';

/**
 * Returns a ctrl+<char> unicode value for a given <char>
 *
 * This does NOT compose with other functions.
 */
export function ctrl(c) {
	const charNum = c.charCodeAt(0) - 'a'.charCodeAt(0);
	if (charNum > 25) {
		throw new Error('ctrl modifier can only be used for lowercase letters');
	}
	//See http://unicodelookup.com/#ctrl
	return String.fromCharCode(charNum + 1);
}

/**
 * Returns a alt+<char> unicode value for a given <char>
 *
 * This does NOT compose with other functions.
 */
export function alt(c) {
	return '\u001b' + c;
}

const presses = [];
const callbacks = [];

function flushQueue(){
	while (callbacks.length && presses.length) {
		callbacks.pop()(presses.pop());
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
export function next() {
	if (presses.length) {
		return presses.pop();
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
export function peek() {
	if (presses.length) {
		return presses[presses.length - 1];
	}
	return new Promise(resolve => {
		callbacks.unshift((res) => {
			presses.push(res);
			resolve(res);
		});
	});
}


function keyProcessor(ch, key) {
	presses.unshift({ ch, key });
	flushQueue();
}

export const keys = {
	BACKSPACE : '\u007f',
	ESCAPE : '\u001b'
};

export const other = Symbol('other');


/**
 * Starts the keyboard processing.
 *
 * Bindings should be an object that maps (unicode) chars to actions. Note that
 * unicode also has codepoints for things like ctrl+a, which will be understood
 * by these bindings as well.
 *
 * An action may return a new set of bindings which will replace the current set of bindings
 */
export default function start() {
	keypress(stdin);
	stdin.on('keypress', keyProcessor);
}
