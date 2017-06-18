import { keys, next } from '../keyboardProcessor';
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
		'c' : async () => {
			let firstPress = await next();
			let { ch, key } = firstPress;
			if (ch === 'c') {
				removeLine(state);
				await insertMode(state);
			} else if (ch !== keys.escape) {
				await deleteUnderMovement(state, firstPress);
				await insertMode(state);
			}
		}
	};
}
