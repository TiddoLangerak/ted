import { ContentManager } from "./contentManager";
import { Window } from "./window";
import { Screen } from "./screen";
import { Stdio } from "./stdio";

export type State = {
  window: Window;
  contentManager: ContentManager;
  setCurrentMode(mode: string): void;
  getCurrentMode(): string;
  screen: Screen;
  stdio: Stdio;
};
