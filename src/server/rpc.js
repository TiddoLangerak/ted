import { sendMessage, messageTypes } from '../protocol';
import { getBuffer } from './bufferManager';

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
	}
};
