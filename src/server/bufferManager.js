import { createFileBuffer } from './buffer';

const cache = new Map();
export async function getBuffer(file) {
	if (!cache.has(file)) {
		const buffer = await createFileBuffer(file);
		cache.set(file, buffer);
	}
	return cache.get(file);
}
