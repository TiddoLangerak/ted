import { draw, registerDrawable } from './screen';
import styles from 'ansi-styles';

export const anchors = {
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

export default function createCursor(window) {
	let x = 0;
	const cursor = {
		isAnchored() {
			return !Number.isFinite(x);
		},
		get x() {
			if (cursor.isAt(anchors.EOL)) {
				return window.lineLength(window.cursor.y);
			}
			return x;
		},
		set x(val) {
			x = val;
		},
		y: 0,
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
			if (!cursor.isAnchored()) {
				cursor.x = Math.min(
														window.lineLength(cursor.y),
														cursor.x
				);
				cursor.x = Math.max(0, cursor.x);
				//Auto anchor (exclude 0 for empty lines)
				if (cursor.x !== 0 && cursor.x === window.lineLength(cursor.y)) {
					cursor.x = anchors.EOL;
				}
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
		isAt(point) {
			return x === point;
		},
		moveLeft(amount = 1) {
			cursor.update(cursor => cursor.x -= amount);
		},
		moveRight(amount = 1) {
			cursor.update(cursor => cursor.x += amount);
		},
		moveUp(amount = 1) {
			cursor.update(cursor => cursor.y -= amount);
		},
		moveDown(amount = 1) {
			cursor.update(cursor => cursor.y += amount);
		},
		moveToEOL() {
			cursor.update(cursor => cursor.x = anchors.EOL);
		},
		moveToStartOfLine() {
			cursor.update(cursor => cursor.x = 0);
		}
	};

	registerDrawable('CURSOR', buffer => {
		const cursorPos = getScreenCoordinates(window, cursor);
		//We need to copy the modifiers since it may be shared with other characters
		const mods = new Set(buffer[cursorPos.row][cursorPos.column].modifiers);
		mods.add(styles.bgWhite);
		mods.add(styles.black);
		buffer[cursorPos.row][cursorPos.column].modifiers = mods;
	});
	return cursor;
}
