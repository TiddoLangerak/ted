import commandDispatcher from '../commandDispatcher';
import { draw } from '../screen';
import { keys, other } from '../keyboardProcessor';
import { isCharKey } from '../motions/utils';

export default ({ changeMode }) => {
	return {
		[keys.ESCAPE] : () => {
			commandDispatcher.command = '';
			return changeMode('normal');
		},
		[keys.BACKSPACE] : () => {
			commandDispatcher.command = commandDispatcher.command.slice(0, -1);
			draw();
		},
		'\r' : () => {
			commandDispatcher.doIt();
			commandDispatcher.command = '';
			return changeMode('normal');
		},
		[other] : (ch, key) => {
			if (isCharKey(ch, key)) {
				commandDispatcher.command += ch;
				draw();
			}
		}
	};
};
