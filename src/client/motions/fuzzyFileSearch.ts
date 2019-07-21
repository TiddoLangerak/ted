import subScreen from '../subScreen';
import { draw } from '../screen';
import { ctrl, alt } from '../keyboardProcessor';
import { State } from "../state";

export default ({ contentManager }: State) => {
  function searchWith(program: string, args = []) {
    const child = subScreen(program, args, {
      cwd: process.cwd(),
      // We allow stderr to be used to draw on, and we assume stdout will be used to place
      // the result in
      stdio: [process.stdin, 'pipe', process.stderr],
    });
    let file = '';
    child.stdout!.on('data', (data) => { file += data; });
    child.on('close', () => {
      if (file.trim()) {
        contentManager.changeFile(file);
      }
      draw();
    });
  }
  return {
    [ctrl('p')]: () => searchWith('fzf'),
    [alt('p')]: () => searchWith('rangerFileChoser'),
  };
};
