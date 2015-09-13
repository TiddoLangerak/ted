import net from 'net';
import { getSocketPath } from '../socketManager';
import path from 'path';
import { messageParser, sendMessage, messageTypes } from '../protocol.js';
import { draw, registerDrawable, drawPriorities } from './screen';
import { error, log, clearLog } from './screenLogger';
import keyboardProcessor, { ctrl, keys } from './keyboardProcessor';
import window from './window';
import util from 'util';
import { fillLine } from './screenBufferUtils';
import uuid from 'uuid';
import { applyDiff, diffTypes } from '../diff';

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
			mainWindow.file = message.buffer.filePath;
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
		},
		[keys.BACKSPACE] : () => {
			if (mainWindow.cursor.y === mainWindow.cursor.x === 0) {
				return;
			}
			const to = {
				line : mainWindow.cursor.y,
				column : mainWindow.cursor.x
			};
			let from;
			if (mainWindow.cursor.x > 0) {
				from = {
					line : mainWindow.cursor.y,
					column : mainWindow.cursor.x - 1
				};
			} else {
				from = {
					line : mainWindow.cursor.y - 1,
					column : mainWindow.lineLength(mainWindow.cursor.y - 1)
				};
			}
			mainWindow.content = applyDiff(mainWindow.lines, {
				type : diffTypes.DELETE,
				from, to
			});
			mainWindow.updateCursor(cursor => {
				cursor.y = from.line;
				cursor.x = from.column;
			});
		},
		default : (ch, key) => {
			let isChar = true;
			if (!ch ||
					key && (key.ctrl || key.meta)
				 ) {
				isChar = false;
			}
			if (isChar) {
				let text = ch;
				//TODO: this better
				if (ch === '\r') {
					text = '\n';
				}
				mainWindow.content = applyDiff(mainWindow.lines, {
					type : diffTypes.INSERT,
					line : mainWindow.cursor.y,
					column : mainWindow.cursor.x,
					text
				});
				if (text === '\n') {
					mainWindow.updateCursor(cursor => {
						cursor.y++;
						cursor.x = 0;
					});
				} else {
					mainWindow.updateCursor(cursor => cursor.x++);
				}
				//TODO: update stuff
			}
		}
	}
};

keyboardProcessor(modes.normal);

draw();
