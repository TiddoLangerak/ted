import fs from 'fs';
import promisify from '../promisify';
import { applyDiff, invertDiff } from '../diff';
import type { Diff } from '../diff';

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

class Buffer {
  history: Diff[];
  future: Diff[];
  content: string;
  originalContent: string;
  constructor(content: string) {
    this.content = content;
    this.originalContent = content;
    this.history = [];
    this.future = [];
  }
  applyDiff(diff: Diff) {
    this.history.push(diff);
    this.future = [];
    this.content = applyDiff(this.content, diff);
  }
  isDirty() {
    return this.content !== this.originalContent;
  }
  undo() {
    if (this.history.length) {
      const originalDiff = this.history.pop();
      const diff = invertDiff(originalDiff);
      this.content = applyDiff(this.content, diff);
      this.future.unshift(originalDiff);
      return diff;
    }
    return null;
  }
  redo() {
    if (this.future.length) {
      const diff = this.future.shift();
      this.content = applyDiff(this.content, diff);
      this.history.push(diff);
      return diff;
    }
    return null;
  }
}


class FileBuffer extends Buffer {
  filePath: string;
  readOnly: boolean;
  originalContent: string;
  constructor(filePath: string, content: string = '', readOnly: boolean = false) {
    super(content);
    this.filePath = filePath;
    this.readOnly = readOnly;
  }
  async save(force) {
    if (!force) {
      // If we don't force save we first check if the file hasn't changed in the mean time.
      // It would be a shame if we overwrite external changes without notifying the user
      const readable = await checkAccess(this.filePath, fs.R_OK);
      if (readable) {
        const currentContent = await promisify(cb => fs.readFile(this.filePath, 'utf8', cb));
        if (currentContent !== this.originalContent) {
          // TODO: indicate this somewhere
          throw new Error('Buffer has changed on disk. Force save to overwrite');
        }
      }
    }
    await promisify(cb => fs.writeFile(this.filePath, this.content, cb));
    this.originalContent = this.content;
  }
}

// eslint-disable-next-line import/prefer-default-export
export async function createFileBuffer(filePath: string): Promise<FileBuffer> {
  const fileExists = await checkAccess(filePath, fs.F_OK);
  if (!fileExists) {
    return new FileBuffer(filePath);
  }
  const readable = await checkAccess(filePath, fs.R_OK);
  if (!readable) {
    // TODO: better error objects
    throw new Error(`${filePath} is not readable`);
  }
  const [writeable, content] = await Promise.all([
    checkAccess(filePath, fs.W_OK),
    promisify(cb => fs.readFile(filePath, 'utf8', cb)),
  ]);
  // TODO: install watchers on the file system
  return new FileBuffer(filePath, content, !writeable);
}
