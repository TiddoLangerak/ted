import 'babel/polyfill';
import net from 'net';
import { getSocketPath } from '../socketManager';
import rpc from './rpc';
import { messageParser, messageTypes, sendMessage } from '../protocol';
import { getBuffer } from './bufferManager';

const clients = new Set();

const server = net.createServer((client) => {
	console.log('Client connected');
	clients.add(client);
	client.on('end', () => {
		console.log('Client disconnected');
		clients.delete(client);
	});

	client.on('data', messageParser(async function (message) {
		switch (message.type) {
			case messageTypes.RPC:
				try {
					await rpc[message.action](client, message.arguments);
				} catch (e) {
					console.error('RPC action failed: ', e);
					sendMessage(client, { type : messageTypes.ERROR, message : e.message });
				}
				break;
			case messageTypes.DIFF:
				const buffer = await getBuffer(message.file);
				buffer.applyDiff(message.diff);
				clients.forEach(client => sendMessage(client, message));
				break;

			default:
				console.error(`Unkown message type: ${message.type}`);
		}
	}));
});

const socketPath = getSocketPath();

server.listen(socketPath, () => {
	console.log('Server started');
});

server.on('error', (err) => {
	console.log('server error', err);
});

function cleanup() {
	if (server._handle) {
		console.log('closing server');
		clients.forEach((client) => client.end());
		clients.clear();
		server.close();
	}
	process.exit(0);
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);
