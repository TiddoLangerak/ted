import { sendMessage, messageTypes } from '../protocol';
import { createFileBuffer } from './buffer';

export default {
	async requestFile(client, { file }) {
		const buffer = await createFileBuffer(file);
		sendMessage(client, { type : messageTypes.BUFFER, buffer });
	}
};
