import { diffTypes } from '../../diff';
import { anchors } from '../Cursor';

export default ({ window, changeMode, contentManager }) => ({
	'i' : () => {
		return changeMode('insert');
	},
	'a' : () => {
		window.cursor.moveRight();
		return changeMode('insert');
	},
	'A' : () => {
		window.cursor.moveToEOL();
		return changeMode('insert');
	},
	'o' : () => {
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
			return changeMode('insert');
	},
	'O' : () => {
		const diff = {
			type : diffTypes.INSERT,
			line : window.cursor.y,
			column : 0,
			text : '\n'
		};
		contentManager.processClientDiff(diff);
		window.cursor.moveUp();
		return changeMode('insert');
	}
});
