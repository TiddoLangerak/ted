import { keys } from '../keyboardProcessor';
import { copy } from 'copy-paste';
import { diffTypes } from '../../diff';
import search from './search';
import movement from './movement';
import { processKey } from '../keyboardProcessor';
import { log } from '../screenLogger';

export default (state) => {
	const { window, changeMode, contentManager } = state;
	const deleteMotionDelegates = Object.assign(search(state), movement(state));

	function deleteUnderMovement(moveCursor) {
		let from = {
			line : window.cursor.y,
			column : window.cursor.x
		};
		moveCursor();
		let to = {
			line : window.cursor.y,
			column : window.cursor.x + 1
		};
		//If this is a backwards deletion then we need to swap to and from. Additionally we need
		//to decrement the column of the new from character, such that the character we move to is
		//deleted as well (but not the character under cursor)
		if (to.line < from.line || (to.line === from.line && to.column < from.column)) {
			const temp = to;
			to = from;
			from = temp;
			from.column = Math.max(0, from.column - 1);
		}
		const diff = {
			type : diffTypes.DELETE,
			from, to,
			text : window.getText(from, to)
		};
		contentManager.processClientDiff(diff);
	}

	function delegatedDeletion(postDelegation = ()=>{}, preDelegation = ()=>{}) {
		return (ch, key) => {
			preDelegation();
			deleteUnderMovement(() => {
				processKey(deleteMotionDelegates, ch, key);
				postDelegation();
			});
			return changeMode('normal');
		};
	}

	return {
		'd' : () => {
			return {
				'd' : () => {
					const line = window.lines[window.cursor.y];
					copy(line + '\n');
					const from = {
						line : window.cursor.y,
						column : 0
					};
					const to = {
						line : window.cursor.y + 1,
						column : 0
					};
					//If this is the last line then we want to remove the trailing newline as well, so we extent
					//the range slightly
					if (window.lines.length - 1 === window.cursor.y && window.cursor.y !== 0) {
						from.line--;
						from.column = window.lineLength(from.line);
					}
					const diff = {
						type : diffTypes.DELETE,
						from, to,
						text : window.getText(from, to)
					};
					contentManager.processClientDiff(diff);

					return changeMode('normal');
				},
				'w' : delegatedDeletion(() => window.cursor.moveLeft()),
				'W' : delegatedDeletion(() => window.cursor.moveLeft()),
				default : delegatedDeletion(),
				[keys.ESCAPE] : () => changeMode('normal')
			};
		}
	};
};
