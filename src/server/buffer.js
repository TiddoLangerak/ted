import fs from 'fs';
import promisify from '../promisify';
import { applyDiff, invertDiff } from '../diff';

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
		this.history.push(diff);
		this.future = [];
		this.content = applyDiff(this.content, diff);
	},
	isDirty() {
		return this.content !== this.originalContent;
	},
	undo() {
		if (this.history.length) {
			const originalDiff = this.history.pop();
			const diff = invertDiff(originalDiff);
			this.content = applyDiff(this.content, diff);
			this.future.unshift(originalDiff);
			return diff;
		} else {
			return null;
		}
	},
	redo() {
		if (this.future.length) {
			const diff = this.future.shift();
			this.content = applyDiff(this.content, diff);
			this.history.push(diff);
			return diff;
		} else {
			return null;
		}
	}
};

const FileBuffer = Object.assign(Object.create(Buffer), {
	async save(force) {
		if (!force) {
			//If we don't force save we first check if the file hasn't changed in the mean time.
			//It would be a shame if we overwrite external changes without notifying the user
			const readable = await checkAccess(this.filePath, fs.R_OK);
			if (readable) {
				const currentContent = await promisify(cb => fs.readFile(this.filePath, 'utf8', cb));
				if (currentContent !== this.originalContent) {
					//TODO: indicate this somewhere
					throw new Error('Buffer has changed on disk. Force save to overwrite');
				}
			}
		}
		await promisify(cb => fs.writeFile(this.filePath, this.content, cb));
		this.originalContent = this.content;
	}
});

function newFileBuffer(filePath, content = '', readonly = false) {
	return Object.assign(Object.create(FileBuffer), { filePath, content, readonly, originalContent : content, history : [], future : [] });
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
