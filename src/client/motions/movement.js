export default ({ window, changeMode }) => ({
	'h' : () => window.cursor.moveLeft(),
	'l' : () => window.cursor.moveRight(),
	'j' : () => window.cursor.moveDown(),
	'k' : () => window.cursor.moveUp(),
	'$' : window.cursor.moveToEOL,
	'G' : () => window.cursor.update(cursor => cursor.y = window.lines.length -1),
	'g' : () => ({
		'g' : () => {
			window.cursor.update(cursor => cursor.y = 0);
			return changeMode('normal');
		},
		default: () => changeMode('normal')
	})
});
