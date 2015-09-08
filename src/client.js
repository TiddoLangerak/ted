import blessed from 'blessed';
import net from 'net';
import { getSocketPath } from './socketManager';
import path from 'path';

function sendCommand(client, command) {
	client.write(JSON.stringify(command) + '\n');
}

const socketPath = getSocketPath();
const client = net.connect({ path : socketPath}, () => {
	console.log('Connected to server');
	if (process.argv[2]) {
		const file = path.resolve(process.cwd(), process.argv[2]);
		sendCommand(client, { action : 'open', arguments : { file } });
	}
});

//TODO: share this with server.js
let dataBuffer = '';
client.on('data', (data) => {
	dataBuffer += data;
	const events = dataBuffer.split('\n');
	dataBuffer = events.pop();
	events.forEach((eventString) => {
		const event = JSON.parse(eventString);
		if (event.content) {
			box.content = event.content;
			screen.render();
		}
	});
});


client.on('end', () => {
	console.log('Disconnected');
});

const screen = blessed.screen({});
screen.key(['escape'], (ch, key) => {
	screen.destroy();
});
const box = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  content: '',
  tags: true,
});
screen.append(box);
screen.render();


