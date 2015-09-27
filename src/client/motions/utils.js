export function isCharKey(ch, key) {
	let isChar = true;
	if (!ch ||
			key && (key.ctrl || key.meta)
		 ) {
		isChar = false;
	}
	return isChar;
}

