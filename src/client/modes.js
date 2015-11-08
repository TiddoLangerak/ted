import normalMode from './modes/normal';
import { other } from './keyboardProcessor';

export const initialMode = normalMode;

/**
 * Merges a src tree into the target tree.
 *
 * Note that this alters the target tree.
 */
function mergeTrees(target, src, prefix = '') {
	//Then we merge all src properties into the targed object. We do this in 2 steps:
	//First we merge the functions and in the process we do error checking.
	//Then we recursively merge all submaps
	Reflect.ownKeys(src)
		.filter(key => typeof src[key] === 'function')
		.forEach(key => {
			if (target[key]) {
				throw new Error(`Key sequence "${prefix}${key}" is registered as an action, but it is also `+
				                `a prefix for other key combos.`);
			}
			target[key] = src[key];
		});

	Reflect.ownKeys(src)
		.filter(key => typeof src[key] !== 'function')
		.forEach(key => target[key] = mergeTrees(target[key] || {}, src[key], prefix + key.toString()));

	return target;
}

function mapToTree(map) {
	return Reflect.ownKeys(map)
		.map(keyCombo => {
			if (typeof keyCombo === 'string') {
				return keyCombo.split('')
					.reduceRight((subTree, key) => {
						return { [key] : subTree };
					}, map[keyCombo]);
			} else {
				return {
					[keyCombo] : map[keyCombo]
				};
			}
		})
		.reduce((leftTree, rightTree) => mergeTrees(leftTree, rightTree), {});
}

function treeToGenerator(tree) {
	const subGenerators = {};
	Reflect.ownKeys(tree)
		.forEach(key => {
			if (typeof tree[key] === 'function') {
				subGenerators[key] = tree[key];
			} else {
				subGenerators[key] = treeToGenerator(tree[key]);
			}
		});

	return function*() {
		const { ch, key } = yield;
		const target = key ? key.sequence : ch;
		const processKey = subGenerators[target] || subGenerators[other] || () => {};
		yield * processKey(ch, key);
	};
}

export function fromKeyMap(map) {
	return treeToGenerator(mapToTree(map));
}

