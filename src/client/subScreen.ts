import { spawn } from 'child_process';
import { stdout, stdin, stderr } from './stdio';
import { draw, startAlternateBuffer } from './screen';


export default (function subScreen(command, args = [], opts = {}) {
  opts.stdio = opts.stdio || 'inherit';

  // When we launch a subscreen we don't want the application itself to listen to user input
  // or write output. We therefore detach the streams
  stdin.detach();
  stdout.detach();
  stderr.detach();

  const child = spawn(command, args, opts);
  child.on('close', () => {
    // It is very well possible that the child process closed the alternate buffer.
    // To prevent messing up command history, we start one just in case.
    startAlternateBuffer();
    stderr.attach();
    stdout.attach();
    stdin.attach();
    draw(true, true);
  });
  return child;
}: typeof spawn);
