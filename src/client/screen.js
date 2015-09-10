import escapes from 'ansi-escapes';

const drawables = [];

export function registerDrawable(drawFunction, priority = 0) {
  drawables.push({ draw: drawFunction, priority });
  drawables.sort((a, b) => b.priority - a.priority); //highest prio first
}

export function clear() {
  console.log(escapes.cursorHide);
	console.log(escapes.cursorTo(0, 0));
	console.log(escapes.eraseDown);
}

export function draw() {
  clear();
  drawables.forEach((drawable) => drawable.draw());
}

export const drawPriorities = {
  LOG : 1000
};

process.on('exit', () => {
  console.log(escapes.cursorShow);
});
