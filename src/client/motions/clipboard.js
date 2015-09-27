import { diffTypes } from '../../diff';

let clipboard = '';
let isBlock = false;

export default ({ window, changeMode, contentManager }) => ({
	'y' : () => {
		return {
			'y' : () => {
				clipboard = window.lines[window.cursor.y];
				isBlock = true;
				return changeMode('normal');
			}
		};
	},
	'p' : () => {
		const diff = {
			type : diffTypes.INSERT,
			line : window.cursor.y,
			column : window.cursor.x,
			text : clipboard
		};
		if (isBlock) {
			diff.column = window.lineLength(window.cursor.y);
			diff.text = '\n' + diff.text;
		}
		contentManager.processClientDiff(diff);
		if (isBlock) {
			window.cursor.moveDown();
		}
		return changeMode('normal');
	},
	default : () => changeMode('normal')
});
