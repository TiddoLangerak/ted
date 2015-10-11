import { Transform } from 'stream';

class StdIo extends Transform {
	_transform(chunk, enc, done) {
		done(null, chunk);
	}
}

class StdReadable extends StdIo {
	constructor(stream) {
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
	constructor(stream) {
		super();
		this._stream = stream;
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
	get rows() {
		return this._stream.rows;
	}
	get columns(){
		return this._stream.columns;
	}
}

export const stdin = new StdReadable(process.stdin);
export const stdout = new StdWritable(process.stdout);
export const stderr = new StdWritable(process.stderr);

let _ttyOut = stdout;
//We need to fallback to stderr if stdout is not a tty
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

