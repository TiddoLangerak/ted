export function invertDiff(diff) {
	const inverted = {};
	switch(diff.type) {
		case diffTypes.INSERT:
			inverted.type = diffTypes.DELETE;
			inverted.from = { line : diff.line, column : diff.column };
			const lines = diff.text.split('\n');
			if (lines.length === 1) {
				inverted.to = { line : diff.line, column : diff.column + lines[0].length };
			} else {
				inverted.to = {
					line : diff.line + lines.length - 1,
					column : lines[lines.length - 1].length
				};
			}
			inverted.text = diff.text;
			break;
		case diffTypes.DELETE :
			inverted.type = diffTypes.INSERT;
			inverted.line = diff.from.line;
			inverted.column = diff.from.column;
			inverted.text = diff.text;
			break;
		default :
			throw new Error('Unkown diff type');
	}
	return inverted;
}

export function extractText(lines, from, to) {
	//First get the relevant lines
	const range = lines.slice(from.line, to.line + 1);
	//then slice of the unecessary columns from the beginning and the end
	//Note that we first process the end: doing so keeps the index for the beginning unchanged,
	//even if `from` and `to` are on the same line. (If we were to cut of the beginning first we
	//would have to update the to column if it was on the same line as from.)
	range[range.length - 1] = range[range.length - 1].substr(0, to.column);
	range[0] = range[0].substr(from.column);
	return range.join('\n');
}

/**
 * Apply a diff to some text.
 *
 * The input can be provided both as an array of lines or as a string value. If an array of lines
 * is provided then it will be updated in place. In all cases the new string will be returned.
 */
export function applyDiff(input, diff) {
	let lines = input;
	if (typeof input === 'string') {
		lines = input.split('\n');
	}


	switch (diff.type) {
		case diffTypes.INSERT :
			//We'll create an empty line when text is inserted below the last line
			if (diff.line === lines.length) {
				lines.push('');
			}
			const currentLine = lines[diff.line];
			const newText = currentLine.substr(0, diff.column) + diff.text + currentLine.substr(diff.column);
			//The inserted text can contain newlines, so we may have to replace a single line with multiple new ones
			const newLines = newText.split('\n');
			lines.splice(diff.line, 1, ...newLines);
			break;
		case diffTypes.DELETE :
			const from = diff.from;
			const to = diff.to;
			//First check if the text we're about to remove corresponds with the text given in the diff
			const toRemove = extractText(lines, from, to);
			if (toRemove !== diff.text) {
				throw new Error(`Text to remove does not match actual text. To remove: '${diff.text}' actual: '${toRemove}'`);
			}
			//We are replacing all affected lines in the deletion with one new line. The newline is
			//the 'prefix' of the start line + the 'postfix' of the end-line, i.e. the parts of
			//the lines in the range that we need to keep.
			const newLine = lines[from.line].substr(0, from.column) + lines[to.line].substr(to.column);
			const linesToReplace = diff.to.line - diff.from.line + 1;
			lines.splice(diff.from.line, linesToReplace, newLine);
			break;
		default :
			throw new Error('Unkown diff type ${diff.type}');
	}

	return lines.join('\n');
}

export const diffTypes = {
	INSERT : 'insert',
	DELETE : 'delete'
};
