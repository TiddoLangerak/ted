import fs from 'fs';
import { sendMessage, messageTypes } from './protocol';

export default {
	open(client, { file }) {
		//TODO: validate input
		fs.readFile(file, 'utf8', (err, content) => {
			if (err) {
				console.error(`Could not open file ${file}`);
			} else {
				sendMessage(client, { type : messageTypes.EVENT, file, content });
			}
		});
		//TODO: move out of this file
	}
};
