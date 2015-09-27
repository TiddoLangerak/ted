import { registerDrawable, drawPriorities } from './screen';
import styles from 'ansi-styles';

/**
 * Gets the screen coordinates for a given buffer coordinate
 * The buffer coordinate should specify an {x, y} pair, corresponding to the xth character
 * on the yth line. The screen coordinate will be a  {column, row} pair.
 */
function getScreenCoordinates(window, bufferCoordinates) {
	const screenCoordinates = {
		column : bufferCoordinates.x,
		row : bufferCoordinates.y - window.bufferOffset
	};
	const leadingTabs = window.lines[bufferCoordinates.y]
		.substr(0, bufferCoordinates.x)
		.split('\t')
		.length - 1;

	const columnOffset = leadingTabs * (window.tabWidth - 1);
	screenCoordinates.column += columnOffset;
	return screenCoordinates;
}

export default function createCursor(window) {
	const cursor = {
		x: 0,
		y: 0,
		update(updateFunc) {
			window.updateCursor(updateFunc);
		},
		moveLeft() {
			cursor.update((cursor) => cursor.x--);
		},
		moveRight() {
			cursor.update((cursor) => cursor.x++);
		},
		moveUp() {
			cursor.update((cursor) => cursor.y--);
		},
		moveDown() {
			cursor.update((cursor) => cursor.y++);
		}

	};
	registerDrawable(buffer => {
		const cursorPos = getScreenCoordinates(window, window.cursor);
		//We need to copy the modifiers since it may be shared with other characters
		const mods = new Set(buffer[cursorPos.row][cursorPos.column].modifiers);
		mods.add(styles.bgWhite);
		mods.add(styles.black);
		buffer[cursorPos.row][cursorPos.column].modifiers = mods;
	}, drawPriorities.CURSOR);
	return cursor;
}
