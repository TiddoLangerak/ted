/* @flow */
import uuid from 'uuid';
import net from 'net';
import { sendMessage, messageTypes } from '../protocol';
import { getBuffer } from './bufferManager';


type RPCArg = {
  clients: net.Socket[]
};

type RequestFileArg = {
  file: string
};

type SaveFileArg = {
  file: string,
  force?: boolean
};

type UndoArg = {
  file: string
};

type RedoArg = {
  file: string
};

export default {
  async requestFile(client: net.Socket, { file }: RequestFileArg) {
    const buffer = await getBuffer(file);
    sendMessage(client, { type: messageTypes.BUFFER,
      buffer: {
        filePath: buffer.filePath,
        content: buffer.content,
        readOnly: buffer.readOnly,
        isDirty: buffer.isDirty(),
      } });
  },
  async saveFile(client: net.Socket, { file, force = false }: SaveFileArg) {
    const buffer = await getBuffer(file);
    try {
      await buffer.save(force);
      sendMessage(client, { type: messageTypes.EVENT, event: 'saved', file });
    } catch (e) {
      sendMessage(client, { type: messageTypes.ERROR, message: e.message });
    }
  },
  async undo(sender: net.Socket, { file }: UndoArg, { clients }: RPCArg) {
    const buffer = await getBuffer(file);
    const diff = buffer.undo();
    if (diff) {
      const message = {
        type: messageTypes.DIFF,
        file,
        diff,
        isDirty: buffer.isDirty(),
        uuid: uuid.v1(),
      };
      clients.forEach(client => sendMessage(client, message));
    }
  },
  async redo(sender: net.Socket, { file }: RedoArg, { clients }: RPCArg) {
    const buffer = await getBuffer(file);
    const diff = buffer.redo();
    if (diff) {
      const message = {
        type: messageTypes.DIFF,
        file,
        diff,
        isDirty: buffer.isDirty(),
        uuid: uuid.v1(),
      };
      clients.forEach(client => sendMessage(client, message));
    }
  },
};
