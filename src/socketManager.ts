import fs from 'fs';
import net from 'net';
import { SOCKET_PATH } from './paths';
import promisify from './promisify';

export async function socketExists() {
  return new Promise(resolve => fs.access(SOCKET_PATH, fs.constants.F_OK, err => resolve(!err)));
}

export async function socketIsActive() {
  const exists = await socketExists();
  if (!exists) {
    return false;
  }
  return new Promise((resolve, reject) => {
    const client = net.connect({ path: SOCKET_PATH }, () => {
      client.end();
      resolve(true);
    });
    client.on('error', (err: NodeJS.ErrnoException) => {
      // We'll get ECONNREFUSED when the socket file exists, but isn't active.
      // In that case we want to resolve with false.
      // If we get any other error then something is wrong and we need to bail.
      if (err.code === 'ECONNREFUSED') {
        resolve(false);
      } else {
        reject(err);
      }
    });
  });
}

export async function cleanInactiveSocket() {
  if (!(await socketIsActive()) && await socketExists()) {
    await promisify(cb => fs.unlink(SOCKET_PATH, cb));
  }
}
