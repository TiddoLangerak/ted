import search from '../motions/search';
import movement from '../motions/movement';
import inserts from '../motions/inserts';
import clipboard from '../motions/clipboard';
import deletions from '../motions/deletions';
import fuzzyFileSearch from '../motions/fuzzyFileSearch';
import { log, clearLog } from '../screenLogger';
import { ctrl, keys, other } from '../keyboardProcessor';
import util from 'util';
import commandMode from './command';

import { fromKeyMap } from '../modes';

export default function* (state) {
	const { contentManager, setCurrentMode } = state;
	setCurrentMode('normal');
	const keyMap = Object.assign(
		{
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
			':' : function*() {
				yield * commandMode(state);
			},
			[other] : (ch, key) => {
				log(util.inspect(ch), key);
			}
		},
		movement(state),
		inserts(state),
		search(state),
		clipboard(state),
		deletions(state),
		fuzzyFileSearch(state)
	);
	const generator = fromKeyMap(keyMap);

	while (true) {
		yield * generator();
	}
}

/*
export default (state) => {
	return Object.assign({
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
			[other] : (ch, key) => {
				log(util.inspect(ch), key);
			}
		},
		inserts(state),
		movement(state),
		search(state),
		clipboard(state),
		deletions(state),
		fuzzyFileSearch(state)
	);
};
*/
