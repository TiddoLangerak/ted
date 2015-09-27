import { ctrl, keys } from './keyboardProcessor';
import { log, clearLog } from './screenLogger';
import { draw } from './screen';
import util from 'util';
import { diffTypes } from '../diff';
import commandDispatcher from './commandDispatcher';

function isCharKey(ch, key) {
	let isChar = true;
	if (!ch ||
			key && (key.ctrl || key.meta)
		 ) {
		isChar = false;
	}
	return isChar;
}

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
			[keys.ESCAPE] : () => {
				clearLog();
			},
			'h' : window.cursor.moveLeft,
			'l' : window.cursor.moveRight,
			'j' : window.cursor.moveDown,
			'k' : window.cursor.moveUp,
			'i' : () => {
				return changeMode('insert');
			},
			'a' : () => {
				window.cursor.moveRight();
				return changeMode('insert');
			},
			'A' : () => {
				window.cursor.moveToEOL();
				return changeMode('insert');
			},
			':' : () => {
				commandDispatcher.command = ':';
				return changeMode('command');
			},
			/*
			'o' : () => {
				wi
					const diff = {
						type : diffTypes.INSERT,
						line : window.cursor.y,
						column : window.cursor.x,
					};
					contentManager.processClientDiff(diff);

			},*/
			default : (ch, key) => {
				log(util.inspect(ch), key);
			}
		},
		command : {
			[keys.ESCAPE] : () => {
				commandDispatcher.command = '';
				return changeMode('normal');
			},
			[keys.BACKSPACE] : () => {
				commandDispatcher.command = commandDispatcher.command.slice(0, -1);
				draw();
			},
			'\r' : () => {
				commandDispatcher.doIt();
				commandDispatcher.command = '';
				return changeMode('normal');
			},
			default : (ch, key) => {
				if (isCharKey(ch, key)) {
					commandDispatcher.command += ch;
					draw();
				}
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
				if (isCharKey(ch, key)) {
					let text = ch;
					//TODO: this better
					if (ch === '\r') {
						text = '\n';
					}
					const coordinates = window.cursor.getResolvedCoordinates();
					const diff = {
						type : diffTypes.INSERT,
						line : coordinates.y,
						column : coordinates.x,
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
