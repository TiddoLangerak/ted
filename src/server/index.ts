/* @flow */
import 'babel-polyfill';
import net from 'net';
import mkdirp from 'mkdirp';
import path from 'path';
import { SOCKET_PATH } from '../paths';
import { socketIsActive, cleanInactiveSocket } from '../socketManager';
import rpc from './rpc';
import { messageParser, messageTypes, sendMessage } from '../protocol';
import { getBuffer } from './bufferManager';
import promisify from '../promisify';
import { info, error } from './log';


const clients = new Set();

const server = net.createServer((client) => {
  info('Client connected');
  clients.add(client);
  client.on('end', () => {
    info('Client disconnected');
    clients.delete(client);
  });

  client.on('data', messageParser(async (message) => {
    switch (message.type) {
      case messageTypes.RPC: {
        try {
          await rpc[message.action](client, message.arguments, { clients });
        } catch (e) {
          error('RPC action failed: ', e);
          sendMessage(client, { type: messageTypes.ERROR, message: e.message });
        }
        break;
      }
      case messageTypes.DIFF: {
        const buffer = await getBuffer(message.file);
        buffer.applyDiff(message.diff);
        message.isDirty = buffer.isDirty();
        // To keep things in sync we broadcast to all the clients.
        clients.forEach(c => sendMessage(c, message));
        break;
      }
      default:
        error(`Unkown message type: ${message.type}`);
    }
  }));
});

function cleanup() {
  // eslint-disable-next-line no-underscore-dangle
  if (server._handle) {
    info('closing server');
    clients.forEach(client => client.end());
    clients.clear();
    server.close();
  }
  process.exit(0);
}

process.on('exit', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

server.on('error', (err) => {
  error('server error', err);
});

(async function start() {
  await cleanInactiveSocket();
  const hasActiveSocket = await socketIsActive();
  if (hasActiveSocket) {
    info('There is already a TED server running, quitting.');
    return;
  }
  await cleanInactiveSocket();
  await promisify(cb => mkdirp(path.dirname(SOCKET_PATH), cb));
  server.listen(SOCKET_PATH, () => {
    info('Server started');
  });
}());
