import { Window } from '../window';
import { aScreen } from "../screen/screen.test-factory";
export const defaultLines : ReadonlyArray<string> = [
  "first line",
  "second line",
  "\tthird line",
  "\t\tfourth line"
];
export const defaultContent = defaultLines.join('\n');

export function aWindow(content: string = defaultContent): Window {
  return new Window(aScreen(), content);
}
