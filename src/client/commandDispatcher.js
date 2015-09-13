import { registerDrawable, drawPriorities } from './screen.js';
import { error } from './screenLogger';
import { fillLine } from './screenBufferUtils';

const commands = new Map();

const commandDispatcher = {
	command : '',
	doIt() {
		const action = commands.get(commandDispatcher.command);
		if (action) {
			action();
		} else {
			error(`Action '${commandDispatcher.command}' not found`);
		}
	},
	registerCommand(name, action) {
		commands.add(name, action);
	}
};

registerDrawable(buffer => {
	fillLine(buffer[buffer.length - 1], commandDispatcher.command);
}, drawPriorities.COMMAND_LINE);

export default commandDispatcher;
