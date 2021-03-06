import { keys, next, peek } from "../keyboardProcessor";
import { removeLine, deleteUnderMovement } from "./deletions";
import insertMode from "../modes/insert";
import { State } from "../state";

export default (state: State) =>
  // TODO: deduplicate
  ({
    c: async () => {
      const { ch } = await peek();
      if (ch === "c") {
        // We now want to pop the character, so we call next
        next();
        removeLine(state);
        await insertMode(state);
      } else if (ch !== keys.ESCAPE) {
        await deleteUnderMovement(state);
        await insertMode(state);
      }
    }
  });
