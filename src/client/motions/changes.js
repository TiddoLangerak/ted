import { keys } from '../keyboardProcessor';
import { copy } from 'copy-paste';
import { diffTypes } from '../../diff';
import search from './search';
import movement from './movement';
import { fromKeyMap } from '../modes';
import { removeLine, deleteUnderMovement } from './deletions';
import insertMode from '../modes/insert';

export default (state) => {
	const { window, contentManager } = state;
	const deleteMotionGenerator = fromKeyMap(Object.assign(
		search(state),
		movement(state)));

	//TODO: deduplicate
	return {
		'c' : function*() {
			let firstPress = yield;
			let { ch, key } = firstPress;
			if (ch === 'c') {
				removeLine(state);
				yield * insertMode(state);
			} else if (ch !== keys.escape) {
				yield * deleteUnderMovement(state, firstPress);
				yield * insertMode(state);
			}
		}
	};
}
