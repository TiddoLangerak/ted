import escapes from 'ansi-escapes';

//This will be used to keep track of what is already drawn on screen
let currentRows = [];
function drawBuffer(buffer) {
	const rows = [];
	buffer.forEach((row, idx) => {
		const rowTokens = [
			escapes.cursorTo(0, idx),
			escapes.eraseLine
		];
		let modifiers = new Set();
		row.forEach(cel => {
			modifiers.forEach(currentMod => {
				if (!cel.modifiers.has(currentMod)) {
					rowTokens.push(currentMod.close);
				}
			});
			cel.modifiers.forEach(newMod => {
				if (!modifiers.has(newMod)) {
					rowTokens.push(newMod.open);
				}
			});
			rowTokens.push(cel.ch);
			modifiers = cel.modifiers;
		});
		const tokenString = rowTokens.join('');
		const closeMods = Array.from(modifiers).map(mod => mod.close).join('');
		rows.push(tokenString + closeMods);
	});
	let tokenString = rows.filter((row, idx) =>
		currentRows.length < idx || currentRows[idx] !== row
	).join('\n');
	process.stdout.write(tokenString);
	currentRows = rows;
}

function startAlternateBuffer() {
	process.stdout.write('\x1b[?1049h');
	process.stdout.write(escapes.cursorHide);
}

function closeAlternateBuffer() {
	process.stdout.write('\x1b[?1049l');
	process.stdout.write(escapes.cursorShow);
}

function initialize() {

	startAlternateBuffer();

	process.on('exit', () => {
		closeAlternateBuffer();
	});

	//The information about columns/rows isn't processed yet when this signal fires,
	//so we delay until next tick
	process.on('SIGWINCH', () => process.nextTick(draw));

	return { registerDrawable, draw };
}


export const drawPriorities = {
	CONTENT : 0,
	CURSOR: 100,
	STATUS_LINE : 1000,
	COMMAND_LINE : 1000,
	LOG : 10000
};

const drawables = [];

export function registerDrawable(drawFunction, priority = 0) {
	drawables.push({ draw: drawFunction, priority });
	drawables.sort((a, b) => a.priority - b.priority); //highest prio last, such that it'll override the rest
}

let isInitialized = false;

export function draw(immediate) {
	//If we don't need to draw immediately we'll schedule the drawing for the next tick.
	//The main reason for this is to allow the buffers to temporarily be in an invalid state.
	//As long the invalid state is fixed before the next tick then drawing won't fail.
	if (!immediate) {
		process.nextTick(() => draw(true));
		return;
	}
	if (!isInitialized) {
		initialize();
		isInitialized = true;
	}

	//TODO: instead of letting each drawable drawing directly to the screen they should work on
	//some virtual screen in memory (e.g. an array of lines, or a matrix).
	//The screen class should then do the actual drawing.

	const buffer = Array.from(new Array(process.stdout.rows), () => {
		return Array.from(new Array(process.stdout.columns), () => {
			return { ch : ' ', modifiers : new Set() };
		});
	});
	drawables.forEach((drawable) => drawable.draw(buffer));
	drawBuffer(buffer);
}

