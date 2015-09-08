import 'babel/polyfill';
import net from 'net';
import { getSocketPath } from './socketManager';
import rpc from './rpc';
import { messageParser, messageTypes, sendMessage } from './protocol';

const clients = new Set();

const server = net.createServer((client) => {
	console.log('Client connected');
	clients.add(client);
	client.on('end', () => {
		console.log('Client disconnected');
		clients.delete(client);
	});

	let dataBuffer = '';
	client.on('data', messageParser((message) => {
		switch (message.type) {
			case messageTypes.RPC:
				rpc[message.action](client, message.arguments);
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

function cleanup() {
	if (server._handle) {
		console.log("closing server");
		clients.forEach((client) => client.end());
		clients.clear();
		server.close();
	}
	process.exit(0);
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);
