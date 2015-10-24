import commandDispatcher from '../commandDispatcher';
import { draw } from './screen';

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
		default : (ch, key) => {
			if (isCharKey(ch, key)) {
				commandDispatcher.command += ch;
				draw();
			}
		}
	};
};
