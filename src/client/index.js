import net from 'net';
import { getSocketPath } from '../socketManager';
import path from 'path';
import { messageParser, sendMessage, messageTypes } from '../protocol.js';
import { draw } from './screen';
import { error, log} from './screenLogger';
import keyboardProcessor from './keyboardProcessor';
import window from './window';
import ContentManager from './contentManager';
import Modes from './modes';
import StatusLine from './statusLine';
import { registerCommand } from './commandDispatcher';

const socketPath = getSocketPath();
const client = net.connect({ path : socketPath}, () => {
	log('Connected to server');
	if (process.argv[2]) {
		const file = path.resolve(process.cwd(), process.argv[2]);
		sendMessage(client, { type : messageTypes.RPC, action : 'requestFile', arguments : { file } });
	}
});

const mainWindow = window('');

const contentManager = ContentManager(mainWindow, client);
registerCommand(':w', contentManager.saveBuffer);

//TODO: share this with server.js
client.on('data', messageParser((message) => {
	switch(message.type) {
		case messageTypes.BUFFER:
			mainWindow.content = message.buffer.content;
			mainWindow.file = message.buffer.filePath;
			draw();
			break;
		case messageTypes.DIFF:
			contentManager.processServerDiff(message);
			break;
		case messageTypes.EVENT:
			const event = Object.assign({}, message);
			delete event.type;
			if (event.event === 'saved' && event.file === mainWindow.file) {
				mainWindow.isDirty = false;
				draw();
			}
			log(event);
			break;
		default:
			error(`Unkown message type: ${message.type}`);
	}
}));

client.on('end', () => {
	log('Disconnected');
});



const modes = Modes({ window: mainWindow, contentManager });
StatusLine({ modes, window: mainWindow });


keyboardProcessor(modes.getCurrentMode());

draw();
