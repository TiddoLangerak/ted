import search from '../motions/search';
import movement from '../motions/movement';
import inserts from '../motions/inserts';
import clipboard from '../motions/clipboard';
import deletions from '../motions/deletions';
import changes from '../motions/changes';
import fuzzyFileSearch from '../motions/fuzzyFileSearch';
import { log, clearLog } from '../screenLogger';
import { ctrl, keys, other } from '../keyboardProcessor';
import util from 'util';
import commandMode from './command';
import { fromKeyMap, loopingMode } from '../modes';

export default loopingMode('normal', (state) => {
	const { contentManager } = state;
	return fromKeyMap(Object.assign(
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
		fuzzyFileSearch(state),
		changes(state)
	));
});
