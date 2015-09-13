import { ctrl, keys } from './keyboardProcessor';
import { log, clearLog } from './screenLogger';
import { draw } from './screen';
import util from 'util';
import { diffTypes } from '../diff';

export default function Modes({ window, contentManager }) {
	let currentMode = 'normal';
	function changeMode(name) {
		currentMode = name;
		draw();
		return bindings[name];
	}
	const bindings = {
		normal : {
			[ctrl('c')] : () => {
				process.exit();
			},
			'\r' : () => {
				clearLog();
			},
			'h' : () => {
				window.updateCursor((cursor) => cursor.x--);
			},
			'l' : () => {
				window.updateCursor((cursor) => cursor.x++);
			},
			'j' : () => {
				window.updateCursor((cursor) => cursor.y++);
			},
			'k' : () => {
				window.updateCursor((cursor) => cursor.y--);
			},
			'i' : () => {
				return changeMode('insert');
			},
			default : (ch, key) => {
				log(util.inspect(ch), key);
			}
		},
		insert : {
			[keys.ESCAPE] : () => {
				return changeMode('normal');
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
					from, to
				};
				contentManager.processClientDiff(diff);
			},
			default : (ch, key) => {
				let isChar = true;
				if (!ch ||
						key && (key.ctrl || key.meta)
					 ) {
					isChar = false;
				}
				if (isChar) {
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
		}
	};

	return {
		getCurrentMode() {
			return bindings[currentMode];
		},
		getCurrentModeName() {
			return currentMode;
		}
	};
}
