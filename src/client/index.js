import net from 'net';
import { getSocketPath } from '../socketManager';
import path from 'path';
import { messageParser, sendMessage, messageTypes } from '../protocol.js';
import { draw, registerDrawable, drawPriorities } from './screen';
import { error, log, clearLog } from './screenLogger';
import keyboardProcessor, { ctrl, keys } from './keyboardProcessor';
import window from './window';
import util from 'util';
import { fixedLength, createSegment } from './screenBufferUtils';
import { diffTypes } from '../diff';
import styles from 'ansi-styles';
import ContentManager from './contentManager';

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
		default:
			error(`Unkown message type: ${message.type}`);
	}
}));

client.on('end', () => {
	log('Disconnected');
});



let currentMode = 'normal';

const statusLineBg = styles.bgBlue;
const statusLineMods = new Set([statusLineBg]);
const modeMods = new Set([statusLineBg, styles.bold]);
const statusLineModifiers = new Set([statusLineBg]);
const statusLineOpts = {
	modifiers : statusLineModifiers,
	fillerModifiers : statusLineModifiers
};
registerDrawable(buffer => {
	const statusLine = [
		...createSegment(currentMode.toUpperCase(), modeMods),
		...createSegment(' | ', statusLineMods)
	];
	const fileNameSpace = buffer[buffer.length - 2].length - statusLine.length;
	const fileName = mainWindow.file || '';
	const visibleFileName = fileName.substr(-fileNameSpace);
	const fileNameSegment = fixedLength(visibleFileName, fileNameSpace, statusLineOpts);
	buffer[buffer.length - 2] = [...statusLine, ...fileNameSegment];
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
			if (mainWindow.cursor.y === 0 &&  mainWindow.cursor.x === 0) {
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
			const diff = {
				type : diffTypes.DELETE,
				from, to
			};
			contentManager.processClientDiff(diff);
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
				const diff = {
					type : diffTypes.INSERT,
					line : mainWindow.cursor.y,
					column : mainWindow.cursor.x,
					text
				};
				contentManager.processClientDiff(diff);
			}
		}
	}
};

keyboardProcessor(modes.normal);

draw();
