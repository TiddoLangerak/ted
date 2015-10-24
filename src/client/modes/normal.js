import search from '../motions/search';
import movement from '../motions/movement';
import inserts from '../motions/inserts';
import clipboard from '../motions/clipboard';
import deletions from '../motions/deletions';
import fuzzyFileSearch from '../motions/fuzzyFileSearch';
import { log, clearLog } from '../screenLogger';
import commandDispatcher from '../commandDispatcher';
import { ctrl, keys } from '../keyboardProcessor';
import util from 'util';

export default (state) => {
	const { contentManager, changeMode } = state;
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
	);
};
