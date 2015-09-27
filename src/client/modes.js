import { ctrl, keys } from './keyboardProcessor';
import { log, clearLog } from './screenLogger';
import { draw } from './screen';
import util from 'util';
import { diffTypes } from '../diff';
import commandDispatcher from './commandDispatcher';
import { anchors } from './Cursor';

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
			'h' : () => window.cursor.moveLeft(),
			'l' : () => window.cursor.moveRight(),
			'j' : () => window.cursor.moveDown(),
			'k' : () => window.cursor.moveUp(),
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
			'$' : window.cursor.moveToEOL,
			':' : () => {
				commandDispatcher.command = ':';
				return changeMode('command');
			},
			'o' : () => {
					const diff = {
						type : diffTypes.INSERT,
						line : window.cursor.y,
						column : window.lineLength(window.cursor.y),
						text : '\n'
					};
					contentManager.processClientDiff(diff);
					//When we're at EOL then the newline gets inserted *before* the cursor, so it already moves
					//one line down in the diff processing. Therefore we can't move down when we're at EOL
					if (!window.cursor.isAt(anchors.EOL)) {
						window.cursor.moveDown();
					}
					return changeMode('insert');
			},
			'O' : () => {
				const diff = {
					type : diffTypes.INSERT,
					line : window.cursor.y,
					column : 0,
					text : '\n'
				};
				contentManager.processClientDiff(diff);
				window.cursor.moveUp();
				return changeMode('insert');
			},
			'f' : () => {
				return {
					default : (ch, key) => {
						if (isCharKey(ch, key)) {
							const offset = window.lines[window.cursor.y]
								//We don't want to find the current character, so a +1 offset here
								.substr(window.cursor.x + 1)
								.indexOf(ch) + 1; //+1 to compensate for the +1 above
							if (offset > 0) {
								window.cursor.moveRight(offset);
							}
						}
						return changeMode('normal');
					}
				};
			},
			'F' : () => {
				return {
					default : (ch, key) => {
						if (isCharKey(ch, key)) {
							const xPos = window.lines[window.cursor.y]
								.substr(0, window.cursor.x)
								.lastIndexOf(ch);
							if (xPos > 0) {
								window.cursor.update(cursor => cursor.x = xPos);
							}
						}
						return changeMode('normal');
					}
				};
			},
			't' : () => {
				return {
					default : (ch, key) => {
						if (isCharKey(ch, key)) {
							const offset = window.lines[window.cursor.y]
								//We don't want to find the current character, so a +1 offset here
								.substr(window.cursor.x + 1)
								.indexOf(ch);
							if (offset > 0) {
								window.cursor.moveRight(offset);
							}
						}
						return changeMode('normal');
					}
				};
			},
			'T' : () => {
				return {
					default : (ch, key) => {
						if (isCharKey(ch, key)) {
							let xPos = window.lines[window.cursor.y]
								.substr(0, window.cursor.x)
								.lastIndexOf(ch);
							if (xPos !== -1) {
								xPos++;
								window.cursor.update(cursor => cursor.x = xPos);
							}
						}
						return changeMode('normal');
					}
				};
			},
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
				window.cursor.moveLeft();
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
