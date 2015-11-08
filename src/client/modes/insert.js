import { keys, other } from '../keyboardProcessor';
import { diffTypes } from '../../diff';
import { isCharKey } from '../motions/utils';
import { fromKeyMap } from '../modes';

export default function* (state) {
	const { window, setCurrentMode, contentManager } = state;
	setCurrentMode('insert');

	let isActive = true;
	function exitMode() {
		isActive = false;
	}

	const generator = fromKeyMap({
		[keys.ESCAPE] : () => {
			window.cursor.moveLeft();
			exitMode();
		},
		[keys.BACKSPACE] : () => {
			if (window.cursor.y === 0 &&  window.cursor.x === 0) {
				return;
			}
			const to = {
				line : window.cursor.y,
				column : window.cursor.x
			};
			let from;
			if (window.cursor.x > 0) {
				from = {
					line : window.cursor.y,
					column : window.cursor.x - 1
				};
			} else {
				from = {
					line : window.cursor.y - 1,
					column : window.lineLength(window.cursor.y - 1)
				};
			}
			const diff = {
				type : diffTypes.DELETE,
				from, to,
				text: window.getText(from, to)
			};
			contentManager.processClientDiff(diff);
		},
		[other] : (ch, key) => {
			if (isCharKey(ch, key)) {
				let text = ch;
				//TODO: this better
				if (ch === '\r') {
					text = '\n';
				}
				const diff = {
					type : diffTypes.INSERT,
					line : window.cursor.y,
					column : window.cursor.x,
					text
				};
				contentManager.processClientDiff(diff);
			}
		}
	});

	while (isActive) {
		yield * generator();
	}
}
