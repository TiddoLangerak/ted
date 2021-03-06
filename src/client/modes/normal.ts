import util from "util";
import search from "../motions/search";
import movement from "../motions/movement";
import inserts from "../motions/inserts";
import clipboard from "../motions/clipboard";
import deletions from "../motions/deletions";
import changes from "../motions/changes";
import fuzzyFileSearch from "../motions/fuzzyFileSearch";
import { log, clearLog } from "../screenLogger";
import { ctrl, keys, other } from "../keyboardProcessor";
import commandMode from "./command";
import { fromKeyMap } from "../modes";
import { loopingMode } from "./loopingMode";

export default loopingMode("normal", state => {
  const { contentManager } = state;
  return fromKeyMap({
    [ctrl("c")]: () => {
      process.exit();
    },
    [keys.ESCAPE]: () => {
      clearLog();
    },
    u: () => {
      contentManager.undo();
    },
    [ctrl("r")]: () => {
      contentManager.redo();
    },
    ":": async () => {
      await commandMode(state);
    },
    [other]: (ch, key) => {
      log(util.inspect(ch), util.inspect(key));
    },
    ...movement(state),
    ...inserts(state),
    ...search(state),
    ...clipboard(state),
    ...deletions(state),
    ...fuzzyFileSearch(state),
    ...changes(state)
  });
});
