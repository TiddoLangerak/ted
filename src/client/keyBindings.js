import { other } from './keyboardProcessor';
/**
 * Transforms a (nested) map of keys into a mapping of <key> -> <processingFunction>.
 *
 * E.g.:
 *
 * toFunctionMap({
 *   'a' : {
 *     'b' : () => console.log('foo')
 *   }
 * }) == {
 *   'a' : () => {
 *      return {
 *        'b' : () => console.log('foo');
 *      }
 *   }
 * }
 */
function toFunctionMap(keyMap) {
	const functionMap = {
		[other] : keyMap[other]
	};

	for (let key in keyMap) {
		if (typeof keyMap[key] === 'function') {
			functionMap[key] = keyMap[key];
		} else {
			functionMap[key] = () => {
				return toFunctionMap(keyMap[key]);
			};
		}
	}

	return functionMap;
}


/**
 * Normalizes a set of keysequence->action bindings into a map of key -> action bindings. The
 * generated actions can on it's turn process key sequences.
 * Simplified example:
 *
 * normalizeBindings({
 *   'dd' : deleteLine
 * }) == {
 *    //IRL there will also be default handlers and stuff like that generated
 *   'd' : () => {
 *     return {
 *       'd' : deleteLine
 *     }
 *   }
 * }
 *
 * It also is capable of transforming nested objects into key-action functions, like so:
 *
 * normalizeBindings({
 *   'd' : { [other] : defaultAction }
 * }) == {
 *   'd' : () => {
 *     return { [other] : defaultAction
 *   }
 * }
 *
 *
 * The resetState parameter is an optional function that will be called to reset the state,
 * assuming the keysequence did not alter the state. This argument shouldn't normally be provided
 * by the original caller, this is intended to be used for recursive calls.
 */
function normalizeBindings(bindings, resetState) {
	const keyMap = {
		[other] : (...args) => bindings[other](...args) || resetState()
	};

	resetState = resetState || () => bindings;

	Object.keys(bindings)
		.forEach(key => {
			const keySequence = key.split('');
			const lastKey = keySequence.pop();
			const finalState = keySequence.reduce((state, key) => {
				if (!state[key]) {
					state[key] = {
						[other] : () => keyMap
					};
				}
				return state[key];
			}, keyMap);
			if (typeof bindings[key] === 'function') {
				//Since a key sequence might potentially go through several temporary states, we need to make
				//sure we return the original state after the last keystroke. Hence, the || resetState() at the
				//end
				finalState[lastKey] = (...args) => bindings[key](...args) || resetState();
			} else {
				//This allows users to also specify the bindings in terms of objects, e.g.
				//{ 'd' : { 'd' : doStuff() } }
				//This is essential for default handlers ({ 'd' : { [other] : doStuff() } }), since these
				//can't be identified with a string key
				finalState[lastKey] = finalState[lastKey] || {};
				Object.assign(finalState[lastKey], normalizeBindings(bindings[key], resetState));
			}
		});
	const functionMap = toFunctionMap(keyMap);

	return functionMap;
}

const normalizedBindings = new WeakMap();

export default {
	/**
	 * Normalizes a keybindings object to a representation that can be processed by the keyboard processor.
	 */
	normalize(bindings) {
		if (!normalizedBindings.has(bindings)) {
			normalizedBindings.set(bindings, normalizeBindings(bindings));
		}
		return normalizedBindings.get(bindings);
	}
};
