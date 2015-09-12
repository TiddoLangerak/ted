/**
 * Fills a line with some text with a constant modifier. It'll padd the rest of the line
 * with the filler.
 *
 * If the text is longer than the line then the text will be cut off
 */
export function fillLine(line, text, modifiers = new Set(), filler = ' ', fillerModifiers = new Set()) {
	const numChars = Math.min(line.length, text.length);
	let i = 0;
	for (; i < numChars; i++) {
		line[i].ch = text.substr(i, 1);
		line[i].modifiers = modifiers;
	}
	for (; i < line.length; i++) {
		line[i].ch = filler;
		line[i].modifiers = fillerModifiers;
	}
}
