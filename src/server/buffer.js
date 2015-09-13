import fs from 'fs';
import promisify from '../promisify';
import { applyDiff } from '../diff';

/**
 * Wrapper around fs.access to make it work properly with promises
 * This function is needed because fs.access has a retarded signature:
 * It calls the callback with an error when the check fails, or with nothing
 * when it succeeds. Because fuck consistency.
 */
async function checkAccess(filePath, mode = fs.F_OK) {
	return new Promise((resolve) => {
		fs.access(filePath, mode, (err) => {
			resolve(!err);
		});
	});
}

const Buffer = {
	applyDiff(diff) {
		this.content = applyDiff(this.content, diff);
	}
};

const FileBuffer = Object.create(Buffer);

function newFileBuffer(filePath, content = '', readonly = false) {
	return Object.assign(Object.create(FileBuffer), { filePath, content, readonly });
}

export async function createFileBuffer(filePath) {
	const fileExists = await checkAccess(filePath, fs.F_OK);
	if (!fileExists) {
		return newFileBuffer(filePath);
	}
	const readable = await checkAccess(filePath, fs.R_OK);
	if (!readable) {
		//TODO: better error objects
		throw new Error(`${filePath} is not readable`);
	}
	const [writeable, content] = await Promise.all([
		checkAccess(filePath, fs.W_OK),
		promisify((cb) => fs.readFile(filePath, 'utf8', cb))
	]);
	//TODO: install watchers on the file system
	return newFileBuffer(filePath, content, !writeable);
}
