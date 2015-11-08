import commandDispatcher from '../commandDispatcher';
import { draw } from '../screen';
import { keys, other } from '../keyboardProcessor';
import { isCharKey } from '../motions/utils';
import { fromKeyMap } from '../modes';

export default function*({ setCurrentMode }) {
	setCurrentMode('command');
	commandDispatcher.command = ':';
	let isActive = true;
	function exitMode() {
		commandDispatcher.command = '';
		isActive = false;
	}
	const generator = fromKeyMap({
		[keys.ESCAPE] : exitMode,
		[keys.BACKSPACE] : () => {
			commandDispatcher.command = commandDispatcher.command.slice(0, -1);
			draw();
		},
		'\r' : () => {
			commandDispatcher.doIt();
			exitMode();
		},
		[other] : (ch, key) => {
			if (isCharKey(ch, key)) {
				commandDispatcher.command += ch;
				draw();
			}
		}
	});
	while (isActive) {
		yield * generator();
	}
}
