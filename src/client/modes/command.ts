import commandDispatcher from "../commandDispatcher";
import { keys, other } from "../keyboardProcessor";
import { isCharKey } from "../motions/utils";
import { fromKeyMap } from "../modes";
import { loopingMode } from "./loopingMode";

export default loopingMode("command", ({ screen }, exitMode) => {
  commandDispatcher.command = ":";
  return fromKeyMap({
    [keys.ESCAPE]: exitMode,
    [keys.BACKSPACE]: () => {
      commandDispatcher.command = commandDispatcher.command.slice(0, -1);
      screen.draw();
    },
    "\r": () => {
      commandDispatcher.doIt();
      exitMode();
    },
    [other]: (ch, key) => {
      if (isCharKey(ch, key)) {
        commandDispatcher.command += ch;
        screen.draw();
      }
    }
  });
});
