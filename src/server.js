import 'babel/polyfill';
import net from 'net';
import { getSocketPath } from './socketManager';
import rpc from './rpc';

const clients = new Set();

const server = net.createServer((client) => {
	console.log('Client connected');
	clients.add(client);
	client.on('end', () => {
		console.log('Client disconnected');
		clients.delete(client);
	});

	let dataBuffer = '';

	client.on('data', (data) => {
		dataBuffer += data;
		const commands = dataBuffer.split('\n');
		dataBuffer = commands.pop();
		commands.forEach((command) => {
			try {
				const rpcCall = JSON.parse(command);
				rpc[rpcCall.action](client, rpcCall.arguments);
			} catch(e) {
				//TODO: error handling
				console.error(`Could not execute command: ${e}. Command: ${command}`);
			}

		});
	});
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
