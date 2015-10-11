import styles from 'ansi-styles';
import { registerDrawable } from './screen';
import { createSegment, fixedLength, writeIntoBuffer } from './screenBufferUtils';

export default function createStatusLine({ modes, window }) {
	const statusLineBg = styles.bgBlue;
	const statusLineMods = new Set([statusLineBg]);
	const modeMods = new Set([statusLineBg, styles.bold]);
	const statusLineModifiers = new Set([statusLineBg]);
	const statusLineOpts = {
		modifiers : statusLineModifiers,
		fillerModifiers : statusLineModifiers
	};
	registerDrawable('STATUS_LINE', buffer => {
		const statusLine = [
			...createSegment(modes.getCurrentModeName().toUpperCase(), modeMods),
			...createSegment(' | ', statusLineMods)
		];
		const fileNameSpace = Math.max(0, buffer[0].length - statusLine.length);
		const fileName = window.file || '';
		//We provide the second argument as well such that when fileNameSpace === 0 we get the empty string
		const visibleFileName = fileName.substr(-fileNameSpace, fileNameSpace);

		const fileNameOpts = {
			modifiers : new Set(statusLineOpts.modifiers),
			fillerModifiers : statusLineOpts.fillerModifiers
		};
		if (window.isDirty) {
			fileNameOpts.modifiers.add(styles.red);
		}
		const fileNameSegment = fixedLength(visibleFileName, fileNameSpace, fileNameOpts);
		writeIntoBuffer([[...statusLine, ...fileNameSegment]], buffer);
	});
}
