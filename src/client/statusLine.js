import styles from 'ansi-styles';
import { registerDrawable, drawPriorities } from './screen';
import { createSegment, fixedLength } from './screenBufferUtils';

export default function createStatusLine({ modes, window }) {
	const statusLineBg = styles.bgBlue;
	const statusLineMods = new Set([statusLineBg]);
	const modeMods = new Set([statusLineBg, styles.bold]);
	const statusLineModifiers = new Set([statusLineBg]);
	const statusLineOpts = {
		modifiers : statusLineModifiers,
		fillerModifiers : statusLineModifiers
	};
	registerDrawable(buffer => {
		const statusLine = [
			...createSegment(modes.getCurrentModeName().toUpperCase(), modeMods),
			...createSegment(' | ', statusLineMods)
		];
		const fileNameSpace = buffer[buffer.length - 2].length - statusLine.length;
		const fileName = window.file || '';
		const visibleFileName = fileName.substr(-fileNameSpace);

		const fileNameOpts = {
			modifiers : new Set(statusLineOpts.modifiers),
			fillerModifiers : statusLineOpts.fillerModifiers
		};
		if (window.isDirty) {
			fileNameOpts.modifiers.add(styles.red);
		}
		const fileNameSegment = fixedLength(visibleFileName, fileNameSpace, fileNameOpts);
		buffer[buffer.length - 2] = [...statusLine, ...fileNameSegment];
	}, drawPriorities.STATUS_LINE);
}
