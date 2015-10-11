import { keys } from '../keyboardProcessor';
import { copy } from 'copy-paste';
import { diffTypes } from '../../diff';

export default ({ window, changeMode, contentManager }) => ({
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
			[keys.ESCAPE] : () => changeMode('normal')
		};
	}
});
