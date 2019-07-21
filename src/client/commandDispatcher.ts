import { registerDrawable } from './screen';
import { error } from './screenLogger';
import { fillLine } from './screenBufferUtils';

const commands = new Map();

const commandDispatcher = {
  command: '',
  doIt() {
    const action = commands.get(commandDispatcher.command);
    if (action) {
      action();
    } else {
      error(`Action '${commandDispatcher.command}' not found`);
    }
  },
};

registerDrawable('COMMAND_LINE', (buffer) => {
  fillLine(buffer[0], commandDispatcher.command);
});

export function registerCommand(name: string, action: () => unknown) {
  commands.set(name, action);
}

export default commandDispatcher;
