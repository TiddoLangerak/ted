import { diffTypes } from '../../diff';
import { copy, paste } from 'copy-paste';
import promisify from '../../promisify';

export default ({ window, changeMode, contentManager }) => ({
	'y' : () => {
		return {
			'y' : () => {
				const line = window.lines[window.cursor.y];
				copy(line + '\n');
				return changeMode('normal');
			}
		};
	},
	'p' : () => {
		(async function() {
			const text = await promisify(cb => paste(cb));
			//We want to paste after the cursor, but also move the cursor to the end of the pasted text.
			//Since inserting text *before* the cursor will move the cursor automatically we'll abuse
			//that to position our cursor right: we'll move one character to the right, insert text there
			//and then move one character back.
			//
			//We also support "block mode" pasting, i.e. pasting complete lines. These will always
			//be placed on their own line. Text ending with a newline will be pasted in block mode
			window.cursor.moveRight();
			const diff = {
				type : diffTypes.INSERT,
				line : window.cursor.y,
				column : window.cursor.x,
				text
			};
			const isBlock = text.charAt(text.length - 1) === '\n';
			if (isBlock) {
				diff.column = 0;
				diff.line++;
			}
			contentManager.processClientDiff(diff);
			window.cursor.moveLeft();
			if (isBlock) {
				window.cursor.moveDown();
			}
		}());
		return changeMode('normal');
	},
	default : () => changeMode('normal')
});
