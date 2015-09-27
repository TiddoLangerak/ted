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
			//We are replacing all affected lines in the deletion with one new line. The newline is
			//the "prefix" of the start line + the "postfix" of the end-line, i.e. the parts of
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
