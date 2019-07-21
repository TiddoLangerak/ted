import net from 'net';
import type { Diff } from './diff';

export type MessageTypes = {
  RPC: 'rpc',
  EVENT: 'event',
  BUFFER: 'buffer',
  ERROR: 'error',
  DIFF: 'diff'
};

export const messageTypes : MessageTypes = {
  RPC: 'rpc',
  EVENT: 'event',
  BUFFER: 'buffer',
  ERROR: 'error',
  DIFF: 'diff',
};

export type RPCMessage = {
  type: 'rpc',
  action: string,
  arguments?: mixed
};

export type EventMessage = {
  type: 'event',
  event: string,
  file: string
};

export type BufferMessage = {
  type: 'buffer',
  buffer: {
    filePath: string,
    content: string,
    readOnly: boolean,
    isDirty: boolean
  }
}

export type ErrorMessage = {
  type: 'error',
  message: string
};

export type DiffMessage = {
  type: 'diff',
  file: string,
  diff: Diff,
  isDirty?: boolean,
  uuid: string
};

type Message = RPCMessage | EventMessage | BufferMessage | ErrorMessage | DiffMessage;

export function messageParser(onMessage: Message => mixed) {
  let buffer = '';
  return (data: string) => {
    buffer += data;
    const messages = buffer.split('\n');
    buffer = messages.pop();
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
