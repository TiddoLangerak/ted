import keypress from 'keypress';
import { clearLog } from './screenLogger';

export function start() {
  keypress(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', (ch, key) => {
    if (key && key.name === 'c' && key.ctrl) {
      process.exit();
    }
    if (key && key.sequence === '\r') {
      clearLog();
    }
  });
}
