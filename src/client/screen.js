import escapes from 'ansi-escapes';

const drawables = [];

export function registerDrawable(drawFunction, priority = 0) {
	drawables.push({ draw: drawFunction, priority });
	drawables.sort((a, b) => a.priority - b.priority); //highest prio last, such that it'll override the rest
}

export function clear() {
	process.stdout.write(escapes.cursorHide);
	process.stdout.write(escapes.eraseScreen);
}

export function draw() {
	clear();
	drawables.forEach((drawable) => drawable.draw());
}

export const drawPriorities = {
	CONTENT : 0,
	LOG : 1000
};

process.on('exit', () => {
	process.stdout.write(escapes.cursorShow);
});

//The information about columns/rows isn't processed yet when this signal fires,
//so we delay until next tick
process.on('SIGWINCH', () => process.nextTick(draw));
