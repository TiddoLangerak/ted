import 'babel-polyfill';
import net from 'net';
import { SOCKET_PATH } from '../paths';
import { socketIsActive, cleanInactiveSocket } from '../socketManager';
import rpc from './rpc';
import { messageParser, messageTypes, sendMessage } from '../protocol';
import { getBuffer } from './bufferManager';
import mkdirp from 'mkdirp';
import promisify from '../promisify';
import path from 'path';
import log from './log';

function cleanup() {
	if (server._handle) {
		log('closing server');
		clients.forEach((client) => client.end());
		clients.clear();
		server.close();
	}
	process.exit(0);
}

process.on('exit', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

const clients = new Set();

const server = net.createServer((client) => {
	log('Client connected');
	clients.add(client);
	client.on('end', () => {
		log('Client disconnected');
		clients.delete(client);
	});

	client.on('data', messageParser(async function (message) {
		switch (message.type) {
			case messageTypes.RPC:
				try {
					await rpc[message.action](client, message.arguments, { clients });
				} catch (e) {
					log.error('RPC action failed: ', e);
					sendMessage(client, { type : messageTypes.ERROR, message : e.message });
				}
				break;
			case messageTypes.DIFF:
				const buffer = await getBuffer(message.file);
				buffer.applyDiff(message.diff);
				message.isDirty = buffer.isDirty();
				//To keep things in sync we broadcast to all the clients.
				clients.forEach(client => sendMessage(client, message));
				break;

			default:
				log.error(`Unkown message type: ${message.type}`);
		}
	}));
});

server.on('error', (err) => {
	log.error('server error', err);
});

(async function() {
	await cleanInactiveSocket();
	const hasActiveSocket = await socketIsActive();
	if (hasActiveSocket) {
		log('There is already a TED server running, quitting.');
		return;
	}
	await cleanInactiveSocket();
	await promisify(cb => mkdirp(path.dirname(SOCKET_PATH), cb));
	server.listen(SOCKET_PATH, () => {
		log('Server started');
	});
}());
