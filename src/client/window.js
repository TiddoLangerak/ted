import { draw, registerDrawable, drawPriorities } from './screen';
import styles from 'ansi-styles';
import { fillLine } from './screenBufferUtils';

const Window = {};

export default function (content = '') {
	let lines = content.split('\n');
	const window = Object.create(Window, {
		content : {
			get() {
				return content;
			},
			set(newContent) {
				content = newContent;
				lines = content.split('\n');
				draw();
			}
		},
		lines : {
			get() {
				return Array.of(...lines);
			}
		}
	});
	window.cursor = { x : 0, y : 0 };
	window.lineLength = (line) => {
		if (lines.length < line) {
			return 0;
		} else {
			return lines[line].length;
		}
	};
	window.updateCursor = (updateFunc) => {
		updateFunc(window.cursor);
		//Note: both for y and x the min call must be done before the max call, since
		//it is possible that a negative number comes out of the Math.min call (when rows or cols = 0)
		window.cursor.y = Math.min(process.stdout.rows - 1,
		                    lines.length - 1,
		                    window.cursor.y);
		window.cursor.y = Math.max(0, window.cursor.y);

		window.cursor.x = Math.min(process.stdout.columns - 1,
												//TODO: implement a thing as "cursor at line ending"
		                    window.lineLength(window.cursor.y)/* - 1 */,
		                    window.cursor.x);
		window.cursor.x = Math.max(0, window.cursor.x);
		draw();
	};
	window.tabWidth = 2;

	/**
	 * Not all characters can be properly displayed by the terminal.
	 * This function normalizes the text in such a way that it looks like it should.
	 *
	 * Currently it:
	 * 1. Replaces tabs with spaces
	 * 2. Replaces weird line endings with unix-style line endings
	 */
	function normalizeText(text) {
		//1. replace tabs
		const visualTab = Array.from(new Array(window.tabWidth), () => ' ').join('');
		text = text.replace(/\t/g, visualTab);

		//2. replace line endings
		text = text.replace(/\r\n?/g, '\n');

		return text;
	}

	/**
	 * Gets the screen coordinates for a given buffer coordinate
	 * The buffer coordinate should specify an {x, y} pair, corresponding to the xth character
	 * on the yth line. The screen coordinate will be a  {column, row} pair.
	 */
	function getScreenCoordinates(bufferCoordinates) {
		const screenCoordinates = { column : bufferCoordinates.x, row : bufferCoordinates.y };
		const leadingTabs = window.lines[bufferCoordinates.y]
			.substr(0, bufferCoordinates.x)
			.split('\t')
			.length - 1;

		const columnOffset = leadingTabs * (window.tabWidth - 1);
		screenCoordinates.column += columnOffset;
		return screenCoordinates;
	}


	registerDrawable(buffer => {
		lines.slice(0, buffer.length).forEach((line, idx) => fillLine(buffer[idx], normalizeText(line)));

		const cursorPos = getScreenCoordinates(window.cursor);
		//We need to copy the modifiers since it may be shared with other characters
		const mods = new Set(buffer[cursorPos.row][cursorPos.column].modifiers);
		mods.add(styles.bgWhite);
		mods.add(styles.black);
		buffer[cursorPos.row][cursorPos.column].modifiers = mods;
	}, drawPriorities.CONTENT);

	return window;
}
