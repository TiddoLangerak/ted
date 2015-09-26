import { sendMessage, messageTypes } from '../protocol.js';
import uuid from 'uuid';
import { draw } from './screen';

/**
 * Manages synchronization of content with the server
 */
export default function ContentManager(window, client) {
	const changes = [];
	return {
		processClientDiff(diff) {
			window.processDiff(diff);
			const changeSet = {
				type : messageTypes.DIFF,
				file : window.file,
				diff,
				uuid : uuid.v1()
			};
			sendMessage(client, changeSet);
			changes.push(changeSet);
		},
		processServerDiff(msg) {
			if (!changes.length) {
				if (msg.file === window.file) {
					window.processDiff(msg.diff);
				}
			} else if (msg.uuid === changes[0].uuid) {
				changes.shift();
			} else {
				//TODO: implement rollback & reapply
				throw new Error('Out of sync with server. Cannot do anything but fail now');
			}
			window.isDirty = msg.isDirty;
			draw();
		},
		saveBuffer(force = false) {
			sendMessage(client, {
				type : messageTypes.RPC,
				action : 'saveFile',
				arguments : { file : window.file, force }
			});
		}
	};
}
