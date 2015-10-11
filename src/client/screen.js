import escapes from 'ansi-escapes';
import layout from './screenLayout';

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

	process.on('SIGWINCH', () => draw());

	return { registerDrawable, draw };
}

const drawables = new Map();

export function registerDrawable(name, drawFunction) {
	drawables.set(name, drawFunction);
}

let isInitialized = false;

function drawLayers(layers, buffer) {
	layers.forEach(layer => {
		if (typeof layer === 'string') {
			const drawable = drawables.get(layer);
			drawable(buffer);
		} else { //split window
			let sizeField;
			//Size of the layer in the relevant dimension. I.e. for a vertical split this is the height,
			//for a horizontal split this is the width;
			let layerSize;
			if (layer.split === 'vertical') {
				sizeField = 'height';
				layerSize = buffer.length;
			} else if (layer.split === 'horizontal') {
				sizeField = 'width';
				layerSize = buffer[0].length;
			} else {
				throw new Error(`Split type must be either 'vertical' or 'horizontal', but '${layer.split}' was found`);
			}

			//Number of buffers that have an auto height
			const autoCount = layer.buffers.filter(buff => buff[sizeField] === 'auto').length;
			//Size already claimed by fixed size parts
			const claimedSize = layer.buffers
				.filter(buff => Number.isFinite(buff[sizeField]))
				.reduce((size, buff) => size + buff[sizeField], 0);
			const autoSize = Math.floor((layerSize - claimedSize) / autoCount);

			//We need to also keep track of the remainder to prevent empty rows when multiple auto's are given.
			let autoSizeRemainder = (layerSize - claimedSize) % autoCount;

			//We reduce the buffers onto the screen buffers in such a way that each buffer draws onto
			//it's claimed space and then passes the *remainder* of the buffer to the next iteration.
			//This should result in an empty screen buffer when we're done.
			layer.buffers
				.reduce((screenBuffer, buff) => {
					let size = buff[sizeField];
					if (size === 'auto') {
						size = autoSize;
						if (autoSizeRemainder) {
							size++;
							autoSizeRemainder--;
						}
					}

					if (layer.split === 'vertical') {
						const virtualBuffer = screenBuffer.slice(0, size);
						drawLayers(buff.layers, virtualBuffer);
						return screenBuffer.slice(size);
					} else { //layer.split === 'horizontal'
						let left = [];
						let right = [];
						screenBuffer.forEach(line => {
							left.push(line.slice(0, size));
							right.push(line.slice(size));
						});
						drawLayers(buff.layers, left);
						return right;
					}
				}, buffer);
		}
	});
}

export function draw(immediate) {
	//If we don't need to draw immediately we'll schedule the drawing for the next tick.
	//The main reason for this is to allow the buffers to temporarily be in an invalid state.
	//As long as the invalid state is fixed before the next tick then drawing won't fail.
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
	drawLayers(layout, buffer);
	drawBuffer(buffer);
}

