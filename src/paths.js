/* @flow */
import path from 'path';

const home = process.env.HOME || '/tmp';

export const DOT_FOLDER_NAME = '.ted';
export const DOT_FOLDER_PATH = path.join(home, DOT_FOLDER_NAME);

export const SOCKET_FILE_NAME = 'TED.sock';
export const SOCKET_PATH = path.join(DOT_FOLDER_PATH, SOCKET_FILE_NAME);

export const LOG_FOLDER_NAME = 'logs';
export const LOG_FOLDER_PATH = path.join(DOT_FOLDER_PATH, LOG_FOLDER_NAME);

export const SERVER_LOG_FILE_NAME = 'server.log';
export const SERVER_LOG_PATH = path.join(LOG_FOLDER_PATH, SERVER_LOG_FILE_NAME);
