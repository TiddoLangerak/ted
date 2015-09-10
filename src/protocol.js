export function messageParser(onMessage) {
	let buffer = '';
	return (data) => {
		buffer += data;
		const messages = buffer.split('\n');
		buffer = messages.pop();
		messages.forEach((messageString) => {
			//TODO: error handling
			const message = JSON.parse(messageString);
			onMessage(message);
		});
	};
}

export function sendMessage(target, message) {
	target.write(JSON.stringify(message) + '\n');
}

export const messageTypes = {
	RPC : 'rpc',
	EVENT : 'event',
	BUFFER : 'buffer',
	ERROR : 'error'
};
