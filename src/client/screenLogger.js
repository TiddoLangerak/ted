import { registerDrawable, draw, drawPriorities } from './screen';
import { fillLine } from './screenBufferUtils';
import util from 'util';
import styles from 'ansi-styles';

const logs = [];

function storeLog(msg, type) {
	if (typeof msg !== 'string') {
		msg = util.inspect(msg);
	}
	msg.split('\n').forEach(line => logs.push({ msg : line, type }));
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


const logBg = styles.bgBlack;
const modifiers = {
	default : new Set([logBg]),
	log : new Set([logBg]),
	error : new Set([styles.red, logBg])
};

registerDrawable((buffer) => {
	if (logs.length) {
		//-1 because of the header, -1 for status line, -1 for command line
		const virtualStart = buffer.length - logs.length - 3;
		const start = Math.max(0, virtualStart);
		fillLine(buffer[start], '---LOG---', { modifiers : modifiers.default, fillerModifiers : modifiers.default });
		logs
			.filter((log, idx) =>
				//We only display the last log
				virtualStart + 1 + idx > 0
			)
			.forEach((log, idx) => {
			fillLine(buffer[start + 1 + idx], log.msg, { modifiers : modifiers[log.type], fillerModifiers: modifiers.default });
		});
	}
}, drawPriorities.LOG);

