import { keys } from '../keyboardProcessor';
import { copy } from 'copy-paste';
import { diffTypes } from '../../diff';
import search from './search';
import movement from './movement';
import { fromKeyMap } from '../modes';

export default (state) => {
	const { window, contentManager } = state;
	const deleteMotionGenerator = fromKeyMap(Object.assign(
		search(state),
		movement(state)));

	function* deleteUnderMovement(moveCursor) {
		let from = {
			line : window.cursor.y,
			column : window.cursor.x
		};
		yield * moveCursor();
		let to = {
			line : window.cursor.y,
			column : window.cursor.x
		};
		//If this is a backwards deletion then we need to swap to and from.
		if (to.line < from.line || (to.line === from.line && to.column < from.column)) {
			const temp = to;
			to = from;
			from = temp;
		}
		const diff = {
			type : diffTypes.DELETE,
			from, to,
			text : window.getText(from, to)
		};
		contentManager.processClientDiff(diff);
	}

	function removeLine() {
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
	}

	return {
		'd' : function*() {
			let { ch, key } = yield;
			if (ch === 'd') {
				removeLine();
			} else if (ch !== keys.escape) {
				let sequence = ch;
				yield * deleteUnderMovement(function*() {
					const iterator = deleteMotionGenerator();
					//The start here is a bit ugly: we want to delegate the to iterator, but we've already
					//stolen the first character. Therefore we manually need to start the iterator (first next),
					//pass the first character (second next), and then get in the delegation loop.
					let state = iterator.next();
					if (!state.done) {
						state = iterator.next({ ch, key });
					}
					while (!state.done) {
						({ ch, key } = yield);
						sequence += ch;
						state = iterator.next({ ch, key });
					}
					//Some movements behave a bit different when used as deletion, so we fixup those here
					if ('eEft'.indexOf(sequence.charAt(0)) !== -1) {
						window.cursor.moveRight();
					}
				});
			}
		}
	};
};
