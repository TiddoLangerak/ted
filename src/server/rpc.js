import { sendMessage, messageTypes } from '../protocol';
import { getBuffer } from './bufferManager';

export default {
	async requestFile(client, { file }) {
		const buffer = await getBuffer(file);
		sendMessage(client, { type : messageTypes.BUFFER, buffer });
	},
	async saveFile(client, { file }) {
		const buffer = await getBuffer(file);
		await buffer.save();
		sendMessage(client, { type : messageTypes.EVENT, event : 'saved', file });
	}
};
