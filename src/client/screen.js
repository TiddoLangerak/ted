import escapes from 'ansi-escapes';

function drawBuffer(buffer) {
	//TODO: incremental drawing instead of refreshing the entire buffer
	const tokens = [];
	let modifiers = new Set();
	buffer.forEach(row => {
		row.forEach(cel => {
			modifiers.forEach(currentMod => {
				if (!cel.modifiers.has(currentMod)) {
					tokens.push(currentMod.close);
				}
			});
			cel.modifiers.forEach(newMod => {
				if (!modifiers.has(newMod)) {
					tokens.push(newMod.open);
				}
			});
			tokens.push(cel.ch);
			modifiers = cel.modifiers;
		});
		tokens.push('\n');
	});
	tokens.pop(); //trailing newline
	modifiers.forEach(mod => tokens.push(mod.close));
	process.stdout.write(tokens.join(''));
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
	LOG : 1000,
	STATUS_LINE : 10000
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

