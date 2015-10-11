import { registerDrawable } from './screen.js';
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
		commands.set(name, action);
	}
};

registerDrawable('COMMAND_LINE', buffer => {
	fillLine(buffer[0], commandDispatcher.command);
});

export default commandDispatcher;
