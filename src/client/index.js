import net from 'net';
import { SOCKET_PATH, SERVER_LOG_PATH } from '../paths';
import { socketIsActive } from '../socketManager';
import path from 'path';
import { messageParser, sendMessage, messageTypes } from '../protocol.js';
import { draw } from './screen';
import { error, log} from './screenLogger';
import keyboardProcessor from './keyboardProcessor';
import window from './window';
import ContentManager from './contentManager';
import { initialMode } from './modes';
import StatusLine from './statusLine';
import { registerCommand } from './commandDispatcher';
import { spawn } from 'child_process';
import fs from 'fs';
import promisify from '../promisify';
import mkdirp from 'mkdirp';
import 'babel-polyfill';

(async function() {
	//If the socket isn't active yet then that means there isn't any server yet. In that case we'll
	//start one.
	if (!(await socketIsActive())) {
		await promisify(cb => mkdirp(path.dirname(SERVER_LOG_PATH), cb));
		const serverLog = await promisify(cb => fs.open(SERVER_LOG_PATH, 'a', cb));
		//The node executable may be located at different locations dependening on the system configuration.
		//We do know however that the client itself is started with a valid node executable, hence we can
		//use process.argv[0] to get the executable to node.
		const nodeExecutable = process.argv[0];
		const server = spawn(nodeExecutable, [path.resolve(__dirname, '../server')], {
			stdio : ['ignore', serverLog, serverLog],
			cwd : process.cwd(),
			detached : true
		});
		server.unref();
		await new Promise(resolve => {
			const interval = setInterval(() => {
				fs.access(SOCKET_PATH, fs.F_OK, err => {
					if (!err) {
						clearInterval(interval);
						resolve();
					}
				});
			}, 50);
		});
	}
	log(`Socket path: ${SOCKET_PATH}`);
	const client = net.connect({ path : SOCKET_PATH}, () => {
		log('Connected to server');
		if (process.argv[2]) {
			const file = path.resolve(process.cwd(), process.argv[2]);
			sendMessage(client, { type : messageTypes.RPC, action : 'requestFile', arguments : { file } });
		}
	});

	const mainWindow = window('');

	const contentManager = ContentManager(mainWindow, client);
	registerCommand(':w', contentManager.saveBuffer);
	registerCommand(':w!', () => contentManager.saveBuffer(true));
	registerCommand(':q', process.exit);

	//TODO: share this with server.js
	client.on('data', messageParser((message) => {
		switch(message.type) {
			case messageTypes.BUFFER:
				mainWindow.content = message.buffer.content;
				mainWindow.file = message.buffer.filePath;
				mainWindow.isDirty = message.buffer.isDirty;
				mainWindow.cursor.moveTo(0, 0);
				draw();
				break;
			case messageTypes.DIFF:
				contentManager.processServerDiff(message);
				break;
			case messageTypes.EVENT:
				const event = Object.assign({}, message);
				delete event.type;
				if (event.event === 'saved' && event.file === mainWindow.file) {
					mainWindow.isDirty = false;
					draw();
				}
				log(event);
				break;
			case messageTypes.ERROR:
				error(message.message);
				draw();
				break;
			default:
				error(`Unkown message type: ${message.type}`);
		}
	}));

	client.on('end', () => {
		log('Disconnected');
	});




	//TODO: move this to some other place
	let currentMode = '';
	function getCurrentMode() {
		return currentMode;
	}
	function setCurrentMode(val) {
		currentMode = val;
		draw();
	}
	StatusLine({ getCurrentMode, window: mainWindow });
	keyboardProcessor(initialMode({ window : mainWindow, contentManager, setCurrentMode }));

	draw();
}())
.then(null, err => {
	console.error(err.message);
	console.error(err.stack);
	process.exit(-1);
});
