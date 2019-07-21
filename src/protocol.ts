import net from 'net';
import { Diff } from './diff';
import { RpcAction } from "./protocol/rpc";

export enum MessageType {
  RPC= 'rpc',
  EVENT= 'event',
  BUFFER= 'buffer',
  ERROR= 'error',
  DIFF= 'diff'
};

export type RPCMessage = {
  type: MessageType.RPC
} & RpcAction;

export type EventMessage = {
  type: MessageType.EVENT
  event: string,
  file: string
};

export type BufferMessage = {
  type: MessageType.BUFFER,
  buffer: {
    filePath: string,
    content: string,
    readOnly: boolean,
    isDirty: boolean
  }
}

export type ErrorMessage = {
  type: MessageType.ERROR,
  message: string
};

export type DiffMessage = {
  type: MessageType.DIFF,
  file: string,
  diff: Diff,
  isDirty?: boolean,
  uuid: string
};

type Message = RPCMessage | EventMessage | BufferMessage | ErrorMessage | DiffMessage;

export function messageParser(onMessage: (message: Message) => unknown) {
  let buffer = '';
  return (data: string) => {
    buffer += data;
    const messages = buffer.split('\n');
    buffer = messages.pop() || '';
    messages.forEach((messageString) => {
      // TODO: error handling
      const message = JSON.parse(messageString);
      onMessage(message);
    });
  };
}

export function sendMessage(target: net.Socket, message: Message) {
  target.write(`${JSON.stringify(message)}\n`);
}
