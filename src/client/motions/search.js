import { isCharKey } from './utils';

export default ({ window, changeMode }) => {
	function searchMotion(searchFunc) {
		return () => ({
			default : (ch, key) => {
				if (isCharKey(ch, key)) {
					searchFunc(ch);
				}
				return changeMode('normal');
			}
		});
	}
	return {
		'f' : searchMotion(ch => {
			const offset = window.lines[window.cursor.y]
				//We don't want to find the current character, so a +1 offset here
				.substr(window.cursor.x + 1)
				.indexOf(ch) + 1; //+1 to compensate for the +1 above
			if (offset > 0) {
				window.cursor.moveRight(offset);
			}
		}),
		'F' : searchMotion(ch => {
			const xPos = window.lines[window.cursor.y]
				.substr(0, window.cursor.x)
				.lastIndexOf(ch);
			if (xPos > 0) {
				window.cursor.update(cursor => cursor.x = xPos);
			}
		}),
		't' : searchMotion(ch => {
			const offset = window.lines[window.cursor.y]
				//We don't want to find the current character, so a +1 offset here
				.substr(window.cursor.x + 1)
				.indexOf(ch);
			if (offset > 0) {
				window.cursor.moveRight(offset);
			}
		}),
		'T' : searchMotion(ch => {
			let xPos = window.lines[window.cursor.y]
				.substr(0, window.cursor.x)
				.lastIndexOf(ch);
			if (xPos !== -1) {
				xPos++;
				window.cursor.update(cursor => cursor.x = xPos);
			}
		})
	};
};
