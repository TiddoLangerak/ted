import net from 'net';
import { getSocketPath } from '../socketManager';
import path from 'path';
import { messageParser, sendMessage, messageTypes } from '../protocol.js';
import { draw, registerDrawable, drawPriorities } from './screen';
import { error, log } from './screenLogger';
import * as keyboardProcessor from './keyboardProcessor';
import escapes from 'ansi-escapes';


const socketPath = getSocketPath();
const client = net.connect({ path : socketPath}, () => {
	log('Connected to server');
	if (process.argv[2]) {
		const file = path.resolve(process.cwd(), process.argv[2]);
		sendMessage(client, { type : messageTypes.RPC, action : 'requestFile', arguments : { file } });
	}
});

let content = '';

registerDrawable(() => {
	process.stdout.write(escapes.cursorTo(0, 0));
	const lines = content.split('\n');
	const linesToDraw = lines.slice(0, process.stdout.rows);
	process.stdout.write(linesToDraw.join('\n'));
}, drawPriorities.CONTENT);

//TODO: share this with server.js
client.on('data', messageParser((message) => {
	switch(message.type) {
		case messageTypes.BUFFER:
			content = message.buffer.content;
			draw();
			break;
		default:
			error(`Unkown message type: ${message.type}`);
	}
}));

client.on('end', () => {
	log('Disconnected');
});


keyboardProcessor.start();

draw();
