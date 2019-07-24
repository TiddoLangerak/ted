import { aWindow } from "../window/window.test-factory";
import { Window } from "../window";
import { Cursor } from "../cursor";
import { Screen } from "../screen";
import { aScreen } from "../screen/screen.test-factory";

export function aCursor(window: Window = aWindow(), screen: Screen = aScreen()): Cursor {
  return new Cursor(window, screen);
}
