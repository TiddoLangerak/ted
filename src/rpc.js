import fs from 'fs';

export default {
	open(client, { file }) {
		//TODO: validate input
		fs.readFile(file, 'utf8', (err, content) => {
			if (err) {
				console.error(`Could not open file ${file}`);
			} else {
				client.write(JSON.stringify({ file, content }) + '\n');
			}
		});
		//TODO: move out of this file
	}
};
