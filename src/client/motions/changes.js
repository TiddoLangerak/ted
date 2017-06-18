import { keys, next, peek } from '../keyboardProcessor';
import { copy } from 'copy-paste';
import { diffTypes } from '../../diff';
import search from './search';
import movement from './movement';
import { fromKeyMap } from '../modes';
import { removeLine, deleteUnderMovement } from './deletions';
import insertMode from '../modes/insert';

export default (state) => {
	const { window, contentManager } = state;

	//TODO: deduplicate
	return {
		'c' : async () => {
			const { ch, key } = await peek();
			if (ch === 'c') {
				//We now want to pop the character, so we call next
				next();
				removeLine(state);
				await insertMode(state);
			} else if (ch !== keys.escape) {
				await deleteUnderMovement(state);
				await insertMode(state);
			}
		}
	};
}
