import { sendMessage, messageTypes } from '../protocol';
import { getBuffer } from './bufferManager';
import uuid from 'uuid';

export default {
	async requestFile(client, { file }) {
		const buffer = await getBuffer(file);
		sendMessage(client, { type : messageTypes.BUFFER, buffer });
	},
	async saveFile(client, { file, force = false }) {
		const buffer = await getBuffer(file);
		try {
			await buffer.save(force);
			sendMessage(client, { type : messageTypes.EVENT, event : 'saved', file });
		} catch (e) {
			sendMessage(client, { type : messageTypes.ERROR, message : e.message });
		}
	},
	async undo(client, { file }, { clients }) {
		const buffer = await getBuffer(file);
		const diff = buffer.undo();
		if (diff) {
			const message = {
				type : messageTypes.DIFF,
				file,
				diff,
				isDirty: buffer.isDirty,
				uuid: uuid.v1()
			};
			clients.forEach(client => sendMessage(client, message));
		}
	}
};
