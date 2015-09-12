import screen, { drawPriorities } from './screen';
import styles from 'ansi-styles';
import { fillLine } from './screenBufferUtils';

const { registerDrawable, draw } = screen();

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
		window.cursor.y = Math.max(0, window.cursor.y);
		window.cursor.y = Math.min(process.stdout.rows - 1,
		                    lines.length - 1,
		                    window.cursor.y);

		window.cursor.x = Math.max(0, window.cursor.x);
		window.cursor.x = Math.min(process.stdout.columns - 1,
		                    window.lineLength(window.cursor.y) - 1,
		                    window.cursor.x);
		draw();
	};


	registerDrawable(buffer => {
		lines.slice(0, buffer.length).forEach((line, idx) => fillLine(buffer[idx], line));

		const cursor = window.cursor;
		//We need to copy the modifiers since it may be shared with other characters
		const mods = new Set(buffer[cursor.y][cursor.x].modifiers);
		mods.add(styles.bgWhite);
		mods.add(styles.black);
		buffer[cursor.y][cursor.x].modifiers = mods;
	}, drawPriorities.CONTENT);

	return window;
}
