import { registerDrawable, draw, drawPriorities } from './screen';
import util from 'util';
import styles from 'ansi-styles';
import escapes from 'ansi-escapes';

let logMessage = '';

export function log(...msgs) {
	msgs.forEach((msg) => {
		if (logMessage) {
			logMessage += '\n';
		}
		if (typeof msg === 'string') {
			logMessage += msg;
		} else {
			logMessage += util.inspect(msg);
		}
	});
	draw();
}

export function error(...msgs) {
	msgs.forEach((msg) => {
		log(styles.red + msg + styles.reset);
	});
}

export function clearLog() {
	logMessage = '';
	draw();
}

registerDrawable(() => {
	if (logMessage) {
		const logLines = logMessage.split('\n');
		process.stdout.write(escapes.cursorTo(0, process.stdout.rows - logLines.length - 1));
		process.stdout.write(escapes.eraseDown);
		process.stdout.write('---LOG---\n' + logMessage);
	}
}, drawPriorities.LOG);

