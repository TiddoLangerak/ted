/* eslint-disable no-underscore-dangle */
import { Transform, TransformCallback } from 'stream';
import { ReadStream, WriteStream } from 'tty';

class StdIo extends Transform {
  // eslint-disable-next-line class-methods-use-this
  _transform(chunk: unknown, enc: string, done: TransformCallback) {
    done(null, chunk);
  }
}

class StdReadable extends StdIo {
  _stream: ReadStream;
  _attached: boolean;
  constructor(stream: ReadStream) {
    super();
    this._stream = stream;
    this._stream.setRawMode(true);
    this._attached = false;
    this.attach();
  }
  detach() {
    if (this._attached) {
      this._stream.unpipe(this);
      this._attached = false;
    }
  }
  attach() {
    if (!this._attached) {
      this._stream.pipe(this);
      this._attached = true;
    }
  }
}

class StdWritable extends StdIo {
  _stream: WriteStream;
  _attached: boolean;
  constructor(stream: WriteStream) {
    super();
    this._stream = stream;
    this._attached = false;
    this.attach();
  }
  attach() {
    if (!this._attached) {
      this.pipe(this._stream);
      this._attached = true;
    }
  }
  detach() {
    if (this._attached) {
      this.unpipe(this._stream);
      this._attached = false;
    }
  }
  getRows() {
    return this._stream.rows;
  }
  getColumns() {
    return this._stream.columns;
  }
}

export const stdin = new StdReadable(process.stdin as ReadStream);
export const stdout = new StdWritable(process.stdout as WriteStream);
export const stderr = new StdWritable(process.stderr as WriteStream);

let _ttyOut = stdout;
// We need to fallback to stderr if stdout is not a tty
if (!process.stdout.isTTY) {
  if (!process.stderr.isTTY) {
    throw new Error('Output is not a terminal');
  } else {
    _ttyOut = stderr;
  }
}

if (!process.stdin.isTTY) {
  throw new Error('Stdin is not a tty');
}

export const ttyOut = _ttyOut;

