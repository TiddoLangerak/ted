import path from 'path';

export function getSocketPath() {
	return path.join(process.cwd(), '_editor.sock');
}
