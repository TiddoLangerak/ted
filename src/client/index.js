import net from 'net';
import { getSocketPath } from '../socketManager';
import path from 'path';
import { messageParser, sendMessage, messageTypes } from '../protocol.js';
import screen, { drawPriorities } from './screen';
import { error, log, clearLog } from './screenLogger';
import keyboardProcessor, { ctrl, keys } from './keyboardProcessor';
import window from './window';
import util from 'util';
import { fillLine } from './screenBufferUtils';

const { registerDrawable, draw } = screen();

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


let currentMode = 'normal';

registerDrawable(buffer => {
	fillLine(buffer[buffer.length - 1], currentMode.toUpperCase());
}, drawPriorities.STATUS_LINE);

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
		},
		'i' : () => {
			currentMode = 'insert';
			draw();
			return modes.insert;
		},
		default : (ch, key) => {
			log(util.inspect(ch), key);
		}
	},
	insert : {
		[keys.ESCAPE] : () => {
			currentMode = 'normal';
			draw();
			return modes.normal;
		}
	}
};

keyboardProcessor(modes.normal);

draw();
