import blessed from 'blessed';
import net from 'net';
import { getSocketPath } from '../socketManager';
import path from 'path';
import { messageParser, sendMessage, messageTypes } from '../protocol.js';

const socketPath = getSocketPath();
const client = net.connect({ path : socketPath}, () => {
	console.log('Connected to server');
	if (process.argv[2]) {
		const file = path.resolve(process.cwd(), process.argv[2]);
		sendMessage(client, { type : messageTypes.RPC, action : 'requestFile', arguments : { file } });
	}
});

//TODO: share this with server.js
client.on('data', messageParser((message) => {
	switch(message.type) {
		case messageTypes.BUFFER:
			textArea.content = message.buffer.content;
			screen.render();
			break;
		default:
			console.error(`Unkown message type: ${message.type}`);
	}
}));

client.on('end', () => {
	console.log('Disconnected');
});

const screen = blessed.screen({
	terminal: 'xterm-256color'
});
const textArea = blessed.text({
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  content: '',
  tags: true
});

const cursor = blessed.box({
	top: 0,
	left: 0,
	width: 1,
	height : 1,
	style : {
		bg : '#ffffff',
		fg : '#ffffff',
		transparent : true
	}
});

screen.key(['escape', 'q'], () => {
	screen.destroy();
	client.end();
});

function placeCursorWithinBounds(cursor, screen) {
	cursor.top = Math.min(Math.max(cursor.top, 0), screen.height - 1);
	cursor.left = Math.min(Math.max(cursor.left, 0), screen.width - 1);
}

screen.key(['j'], () => {
	cursor.top++;
	placeCursorWithinBounds(cursor, screen);
	screen.render();
});
screen.key(['k'], () => {
	cursor.top--;
	placeCursorWithinBounds(cursor, screen);
	screen.render();
});
screen.key(['h'], () => {
	cursor.left--;
	placeCursorWithinBounds(cursor, screen);
	screen.render();
});
screen.key(['l'], () => {
	cursor.left++;
	placeCursorWithinBounds(cursor, screen);
	screen.render();
});

screen.append(textArea);
screen.append(cursor);
screen.render();




