import net from 'net';
import { getSocketPath } from '../socketManager';
import path from 'path';
import { messageParser, sendMessage, messageTypes } from '../protocol.js';
import keypress from 'keypress';
import { draw } from './screen';
import { error, log, clearLog } from './screenLogger';


const socketPath = getSocketPath();
const client = net.connect({ path : socketPath}, () => {
	log('Connected to server');
	if (process.argv[2]) {
		const file = path.resolve(process.cwd(), process.argv[2]);
		sendMessage(client, { type : messageTypes.RPC, action : 'requestFile', arguments : { file } });
	}
});

let content = '';
//TODO: share this with server.js
client.on('data', messageParser((message) => {
	switch(message.type) {
		case messageTypes.BUFFER:
			content = message.buffer.content;
//			textArea.content = message.buffer.content;
//			screen.render();
			break;
		default:
			error(`Unkown message type: ${message.type}`);
	}
}));

client.on('end', () => {
	log('Disconnected');
});


keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (ch, key) => {
	if (key && key.name === 'c' && key.ctrl) {
		process.exit();
	}
	if (key && key.sequence === '\r') {
		clearLog();
	}
});

draw();
