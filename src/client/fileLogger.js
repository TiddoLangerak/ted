import fs from 'fs';
import util from 'util';

export default function(msg) {
	if (typeof msg !== 'string') {
		msg = util.inspect(msg);
	}
	fs.appendFileSync(process.cwd() + '/log', msg + '\n');
}
