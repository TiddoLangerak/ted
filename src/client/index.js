import net from 'net';
import { getSocketPath } from '../socketManager';
import path from 'path';
import { messageParser, sendMessage, messageTypes } from '../protocol.js';
import screen from './screen';
import { error, log, clearLog } from './screenLogger';
import keyboardProcessor, { ctrl } from './keyboardProcessor';
import window from './window';

const { draw } = screen();

const socketPath = getSocketPath();
const client = net.connect({ path : socketPath}, () => {
	log('Connected to server');
	if (process.argv[2]) {
		const file = path.resolve(process.cwd(), process.argv[2]);
		sendMessage(client, { type : messageTypes.RPC, action : 'requestFile', arguments : { file } });
	}
});

const mainWindow = window('');

//TODO: share this with server.js
client.on('data', messageParser((message) => {
	switch(message.type) {
		case messageTypes.BUFFER:
			log("new content");
			mainWindow.content = message.buffer.content;
			draw();
			break;
		default:
			error(`Unkown message type: ${message.type}`);
	}
}));

client.on('end', () => {
	log('Disconnected');
});


const modes = {
	normal : {
		[ctrl('c')] : () => {
			process.exit();
		},
		'\r' : () => {
			clearLog();
		},
		'h' : () => {
			mainWindow.updateCursor((cursor) => cursor.x--);
		},
		'l' : () => {
			mainWindow.updateCursor((cursor) => cursor.x++);
		},
		'j' : () => {
			mainWindow.updateCursor((cursor) => cursor.y++);
		},
		'k' : () => {
			mainWindow.updateCursor((cursor) => cursor.y--);
		}
	}
};

keyboardProcessor(modes.normal);

draw();
