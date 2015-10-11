import { ctrl, keys } from './keyboardProcessor';
import { log, clearLog } from './screenLogger';
import { draw } from './screen';
import util from 'util';
import { diffTypes } from '../diff';
import commandDispatcher from './commandDispatcher';
import { isCharKey } from './motions/utils';
import search from './motions/search';
import movement from './motions/movement';
import inserts from './motions/inserts';
import clipboard from './motions/clipboard';
import deletions from './motions/deletions';
import fuzzyFileSearch from './motions/fuzzyFileSearch';

export default function Modes({ window, contentManager }) {
	let currentMode = 'normal';
	function changeMode(name) {
		currentMode = name;
		draw();
		return bindings[name];
	}
	const state = { window, changeMode, contentManager };
	const bindings = {
		normal : Object.assign({
				[ctrl('c')] : () => {
					process.exit();
				},
				[keys.ESCAPE] : () => {
					clearLog();
				},
				'u' : () => {
					contentManager.undo();
				},
				[ctrl('r')] : () => {
					contentManager.redo();
				},
				':' : () => {
					commandDispatcher.command = ':';
					return changeMode('command');
				},
				default : (ch, key) => {
					log(util.inspect(ch), key);
				}
			},
			inserts(state),
			movement(state),
			search(state),
			clipboard(state),
			deletions(state),
			fuzzyFileSearch(state)
		),
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
					from, to,
					text: window.getText(from, to)
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
