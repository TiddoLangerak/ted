import uuid from "uuid";
import net, { Socket } from "net";
import { sendMessage, MessageType, DiffMessage } from "../protocol";
import { getBuffer } from "./bufferManager";
import { RequestFileArg, SaveFileArg, UndoArg, RedoArg } from "../protocol/rpc";

type RPCArg = {
  clients: Set<Socket>;
};

export default {
  async requestFile(client: net.Socket, { file }: RequestFileArg) {
    const buffer = await getBuffer(file);
    sendMessage(client, {
      type: MessageType.BUFFER,
      buffer: {
        filePath: buffer.filePath,
        content: buffer.content,
        readOnly: buffer.readOnly,
        isDirty: buffer.isDirty()
      }
    });
  },
  async saveFile(client: net.Socket, { file, force = false }: SaveFileArg) {
    const buffer = await getBuffer(file);
    try {
      await buffer.save(force);
      sendMessage(client, { type: MessageType.EVENT, event: "saved", file });
    } catch (e) {
      sendMessage(client, { type: MessageType.ERROR, message: e.message });
    }
  },
  async undo(sender: net.Socket, { file }: UndoArg, { clients }: RPCArg) {
    const buffer = await getBuffer(file);
    const diff = buffer.undo();
    if (diff) {
      const message: DiffMessage = {
        file,
        diff,
        type: MessageType.DIFF,
        isDirty: buffer.isDirty(),
        uuid: uuid.v1()
      };
      clients.forEach(client => sendMessage(client, message));
    }
  },
  async redo(sender: net.Socket, { file }: RedoArg, { clients }: RPCArg) {
    const buffer = await getBuffer(file);
    const diff = buffer.redo();
    if (diff) {
      const message: DiffMessage = {
        file,
        diff,
        type: MessageType.DIFF,
        isDirty: buffer.isDirty(),
        uuid: uuid.v1()
      };
      clients.forEach(client => sendMessage(client, message));
    }
  }
};
