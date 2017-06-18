/* @flow */
import uuid from 'uuid';
import path from 'path';
import net from 'net';
import { sendMessage, messageTypes } from '../protocol';
import { draw } from './screen';
import type { Window } from './window';
import type { Diff } from '../diff';
import type { DiffMessage } from '../protocol';

export type ContentManager = {
  changeFile(string) : void,
  processClientDiff(diff: Diff) : void,
  processServerDiff(msg: DiffMessage) : void,
  saveBuffer(force?: boolean) : void,
  undo() : void,
  redo() : void
};


/**
 * Manages synchronization of content with the server
 */
export default function contentManager(window: Window, client: net.Socket): ContentManager {
  const changes = [];
  return {
    changeFile(relativeFile: string) {
      const file = path.resolve(process.cwd(), relativeFile.trim());
      sendMessage(client, { type: messageTypes.RPC, action: 'requestFile', arguments: { file } });
    },
    /**
     * Processes a diff from the client.
     *
     * This is guaranteed to update the local buffer synchronously.
     */
    processClientDiff(diff: Diff) {
      window.processDiff(diff);
      const changeSet = {
        type: messageTypes.DIFF,
        file: window.file,
        diff,
        uuid: uuid.v1(),
      };
      sendMessage(client, changeSet);
      changes.push(changeSet);
    },
    processServerDiff(msg: DiffMessage) {
      if (!changes.length) {
        if (msg.file === window.file) {
          window.processDiff(msg.diff);
        }
      } else if (msg.uuid === changes[0].uuid) {
        changes.shift();
      } else {
        // TODO: implement rollback & reapply
        throw new Error('Out of sync with server. Cannot do anything but fail now');
      }
      window.isDirty = Boolean(msg.isDirty);
      draw();
    },
    saveBuffer(force: boolean = false) {
      sendMessage(client, {
        type: messageTypes.RPC,
        action: 'saveFile',
        arguments: { file: window.file, force },
      });
    },
    undo() {
      sendMessage(client, {
        type: messageTypes.RPC,
        action: 'undo',
        arguments: { file: window.file },
      });
    },
    redo() {
      sendMessage(client, {
        type: messageTypes.RPC,
        action: 'redo',
        arguments: { file: window.file },
      });
    },
  };
}
