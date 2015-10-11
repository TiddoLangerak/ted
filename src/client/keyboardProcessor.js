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

function keyProcessor(bindings) {
	return (ch, key) => {
		const target = key ? key.sequence : ch;
		let newBindings;
		if (bindings[target]) {
			newBindings = bindings[target](ch, key);
		} else if (bindings.default) {
			newBindings = bindings.default(ch, key);
		}
		if (newBindings) {
			bindings = newBindings;
		}
	};
}

export const keys = {
	BACKSPACE : '\u007f',
	ESCAPE : '\u001b'
};


/**
 * Starts the keyboard processing.
 *
 * Bindings should be an object that maps (unicode) chars to actions. Note that
 * unicode also has codepoints for things like ctrl+a, which will be understood
 * by these bindings as well.
 *
 * An action may return a new set of bindings which will replace the current set of bindings
 */
export default function start(bindings) {
	keypress(stdin);
	stdin.on('keypress', keyProcessor(bindings));
}
