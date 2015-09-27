import { diffTypes } from '../../diff';
import { copy, paste } from 'copy-paste';
import promisify from '../../promisify';


export default ({ window, changeMode, contentManager }) => {
	async function processPaste(beforeCursor = false) {
		let text = await promisify(cb => paste(cb));
		if (!beforeCursor) {
			//When we want to paste after the cursor we just move our cursor one place to the right
			//and then paste before it
			window.cursor.moveRight();
		}

		//When we paste whole lines we don't want to paste them in the middle of the current line.
		//Instead we will make sure they end up on their own lines by moving the cursor to the start
		//of the line (or next line when we want to paste after)
		const isBlock = text.charAt(text.length - 1) === '\n';
		const pasteAtEnd = isBlock && window.lines.length === window.cursor.y + 1;
		if (isBlock) {
			window.cursor.moveToStartOfLine();
			if (!beforeCursor) {
				window.cursor.moveDown();
			}
		}

		const diff = {
			type : diffTypes.INSERT,
			line : window.cursor.y,
			column : window.cursor.x,
			text
		};
		if (pasteAtEnd) {
			diff.line = window.lines.length;
			//We don't want the trailing newline when pasting at the end, so we cut it off
			diff.text = diff.text.slice(0, -1);
		}

		contentManager.processClientDiff(diff);
		//Select the last character of the paste (as if we had just inserted it manually and went back
		//d
		//to normal mode)
		window.cursor.moveLeft();

		//In block mode we want to select the first character of the pasted text instead
		if (isBlock) {
			window.cursor.update(cursor => {
				cursor.x = diff.column;
				cursor.y = diff.line;
			});
		}
	}
	return {
		'y' : () => {
			return {
				'y' : () => {
					const line = window.lines[window.cursor.y];
					copy(line + '\n');
					return changeMode('normal');
				}
			};
		},
		'P' : () => {
			processPaste(true);
			return changeMode('normal');
		},
		'p' : () => {
			processPaste();
			return changeMode('normal');
		},
		default : () => changeMode('normal')
	};
};
