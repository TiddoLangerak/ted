import { spawn, SpawnOptions } from "child_process";
import { Stdio } from "./stdio";
import { Screen } from "./screen";

const subScreen = (
  screen: Screen,
  stdio: Stdio,
  command: string,
  args: ReadonlyArray<string> = [],
  opts: SpawnOptions = {}
) => {
  opts.stdio = opts.stdio || "inherit";

  // When we launch a subscreen we don't want the application itself to listen to user input
  // or write output. We therefore detach the streams
  stdio.stdin.detach();
  stdio.stdout.detach();
  stdio.stderr.detach();

  const child = spawn(command, args, opts);
  child.on("close", () => {
    // It is very well possible that the child process closed the alternate buffer.
    // To prevent messing up command history, we start one just in case.
    screen.startAlternateBuffer();
    stdio.stderr.attach();
    stdio.stdout.attach();
    stdio.stdin.attach();
    screen.draw(true, true);
  });
  return child;
};

export default subScreen;
