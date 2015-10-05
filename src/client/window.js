import { draw, registerDrawable, drawPriorities } from './screen';
import { fillLine } from './screenBufferUtils';
import { applyDiff, diffTypes, extractText } from '../diff';
import createCursor from './Cursor';

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
	window.getText = (from, to) => {
		return extractText(lines, from, to);
	};
	window.cursor = createCursor(window);
	window.lineLength = (line) => {
		if (lines.length < line) {
			return 0;
		} else {
			return lines[line].length;
		}
	};
	window.isDirty = false;
	//nr of lines that the cursor must stay from the edge
	window.cursorPadding = 3;
	window.bufferOffset = 0;

	function pointInRange(from, to, point) {
		if (point.y < from.y) {
			return false;
		}
		if (point.y > to.y) {
			return false;
		}
		if (point.y === from.y && point.x < from.x) {
			return false;
		}
		if (point.y === to.y && point.x > to.x) {
			return false;
		}
		return true;
	}

	window.processDiff = (diff) => {
		applyDiff(lines, diff);
		switch(diff.type) {
			case diffTypes.DELETE:
				if (pointInRange({ x : diff.from.column, y : diff.from.line },
												 { x : diff.to.column, y : diff.to.line },
												 window.cursor)) {
					window.cursor.update(cursor => {
						cursor.x = diff.from.column;
						cursor.y = diff.from.line;
					});
				}
				break;
			case diffTypes.INSERT:
				if (diff.line === window.cursor.y && diff.column <= window.cursor.x) {
					window.cursor.update(cursor => {
						const newLines = diff.text.split('\n');
						cursor.y += newLines.length - 1;
						if (newLines.length > 1) {
							cursor.x = 0;
						}
						cursor.x += newLines.pop().length;
					});
				} else if (diff.line < window.cursor.y) {
					window.cursor.update(cursor => {
						cursor.y += diff.text.split('\n').length - 1;
					});
				}
				break;
		}
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


	registerDrawable(buffer => {
		lines.slice(window.bufferOffset, window.bufferOffset + buffer.length)
			.forEach((line, idx) => fillLine(buffer[idx], normalizeText(line)));
	}, drawPriorities.CONTENT);

	return window;
}
