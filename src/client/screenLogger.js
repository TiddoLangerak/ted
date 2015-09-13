import { registerDrawable, draw, drawPriorities } from './screen';
import { fillLine } from './screenBufferUtils';
import util from 'util';
import styles from 'ansi-styles';

const logs = [];

function storeLog(msg, type) {
	if (typeof msg !== 'string') {
		msg = util.inspect(msg);
	}
	logs.push({ msg, type });
}

export function log(...msgs) {
	msgs.forEach(msg => storeLog(msg, 'log'));
	draw();
}

export function error(...msgs) {
	msgs.forEach(msg => storeLog(msg, 'error'));
}

export function clearLog() {
	logs.splice(0, logs.length);
	draw();
}

const modifiers = {
	log : new Set(),
	error : new Set([styles.red])
};

registerDrawable((buffer) => {
	if (logs.length) {
		const start = buffer.length - logs.length - 2; //-1 because of the heading, and another -1 because of statusline
		fillLine(buffer[start], '---LOG---');
		logs.forEach((log, idx) => {
			fillLine(buffer[start + 1 + idx], log.msg, { modifiers : modifiers[log.type] });
		});
	}
}, drawPriorities.LOG);

