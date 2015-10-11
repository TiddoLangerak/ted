function getPrefix(level) {
	const dateString = (new Date()).toLocaleString('en-GB', { month : 'short', day : '2-digit', hour : '2-digit', minute : '2-digit', second : '2-digit' });
	const upperLevel = level.toUpperCase();
	return `[${dateString}] ${upperLevel}:`;
}
export function log(level, ...msg) {
	const prefix = getPrefix(level);
	let func = level;
	if (func === 'info') {
		func = 'log';
	}
	console[func](prefix, ...msg);
}

export const info = (...msg) => log('info', ...msg);
export const warn = (...msg) => log('warn', ...msg);
export const error = (...msg) => log('error', ...msg);

export default info;
