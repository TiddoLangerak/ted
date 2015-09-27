export default ({ window }) => ({
	'h' : () => window.cursor.moveLeft(),
	'l' : () => window.cursor.moveRight(),
	'j' : () => window.cursor.moveDown(),
	'k' : () => window.cursor.moveUp(),
	'$' : window.cursor.moveToEOL
});
