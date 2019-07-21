/* @flow */
import { createFileBuffer } from './buffer';

const cache = new Map();
// eslint-disable-next-line import/prefer-default-export
export async function getBuffer(file: string) {
  let buffer = cache.get(file);
  if (!buffer) {
    buffer = await createFileBuffer(file);
    cache.set(file, buffer);
  }
  return buffer;
}
