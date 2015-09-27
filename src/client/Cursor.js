import { draw,  registerDrawable, drawPriorities } from './screen';
import styles from 'ansi-styles';

const anchors = {
	EOL : '$'
};
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

function resolveAnchors(cursor, window) {
	if (cursor.x === anchors.EOL) {
		cursor.x = window.lineLength(window.cursor.y);
	}
}

export default function createCursor(window) {
	const cursor = {
		x: 0,
		y: 0,
		getResolvedCoordinates() {
			const coordinates = { x : cursor.x, y : cursor.y };
			resolveAnchors(coordinates, window);
			return coordinates;
		},
		resolveAnchors : () => resolveAnchors(cursor, window),
		update(updateFunc) {
			updateFunc(cursor);
			//Note: both for y and x the min call must be done before the max call, since
			//it is possible that a negative number comes out of the Math.min call (when rows or cols = 0)
			cursor.y = Math.min(
													window.lines.length - 1,
													cursor.y
			);
			cursor.y = Math.max(0, cursor.y);

			//We can't do math with anchor points, so we need to check if we actually have a number
			if (Number.isFinite(cursor.x)) {
				cursor.x = Math.min(
														//TODO: implement a thing as "cursor at line ending"
														window.lineLength(cursor.y)/* - 1 */,
														cursor.x
				);
				cursor.x = Math.max(0, cursor.x);
			}

			//TODO: get this from somewhere
			const windowHeight = process.stdout.rows - 2;
			//Scroll
			if (cursor.y - window.bufferOffset >= windowHeight - window.cursorPadding) {
				window.bufferOffset = cursor.y - windowHeight + window.cursorPadding + 1;
			} else if (cursor.y - window.bufferOffset - window.cursorPadding < 0) {
				window.bufferOffset = Math.max(0, cursor.y - window.cursorPadding);
			}
			draw();
		},
		moveLeft() {
			cursor.resolveAnchors();
			cursor.update(cursor => cursor.x--);
		},
		moveRight() {
			cursor.resolveAnchors();
			cursor.update(cursor => cursor.x++);
		},
		moveUp() {
			cursor.update(cursor => cursor.y--);
		},
		moveDown() {
			cursor.update(cursor => cursor.y++);
		},
		moveToEOL() {
			cursor.update(cursor => cursor.x = anchors.EOL);
		}

	};
	registerDrawable(buffer => {
		const coordinates = cursor.getResolvedCoordinates();
		const cursorPos = getScreenCoordinates(window, coordinates);
		//We need to copy the modifiers since it may be shared with other characters
		const mods = new Set(buffer[cursorPos.row][cursorPos.column].modifiers);
		mods.add(styles.bgWhite);
		mods.add(styles.black);
		buffer[cursorPos.row][cursorPos.column].modifiers = mods;
	}, drawPriorities.CURSOR);
	return cursor;
}
