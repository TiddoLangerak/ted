import commandDispatcher from '../commandDispatcher';
import { draw } from '../screen';
import { keys, other } from '../keyboardProcessor';
import { isCharKey } from '../motions/utils';
import { fromKeyMap, loopingMode } from '../modes';

export default loopingMode('command', (state, exitMode) => {
	commandDispatcher.command = ':';
	return fromKeyMap({
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
});
