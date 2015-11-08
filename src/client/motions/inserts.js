import { diffTypes } from '../../diff';
import { anchors } from '../Cursor';
import insertMode from '../modes/insert';

export default (state) => {
	const { window, contentManager } = state;
	return {
		'i' : function*() {
			yield * insertMode(state);
		},
		'a' : function*() {
			window.cursor.moveRight();
			yield * insertMode(state);
		},
		'A' : function*() {
			window.cursor.moveToEOL();
			yield * insertMode(state);
		},
		'o' : function*() {
			const diff = {
				type : diffTypes.INSERT,
				line : window.cursor.y,
				column : window.lineLength(window.cursor.y),
				text : '\n'
			};
			contentManager.processClientDiff(diff);
			//When we're at EOL then the newline gets inserted *before* the cursor, so it already moves
			//one line down in the diff processing. Therefore we can't move down when we're at EOL
			if (!window.cursor.isAt(anchors.EOL)) {
				window.cursor.moveDown();
			}
			yield * insertMode(state);
		},
		'O' : function*() {
			const diff = {
				type : diffTypes.INSERT,
				line : window.cursor.y,
				column : 0,
				text : '\n'
			};
			contentManager.processClientDiff(diff);
			window.cursor.moveUp();
			yield * insertMode(state);
		}
	};
};
