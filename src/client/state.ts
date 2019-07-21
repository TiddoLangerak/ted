import { ContentManager } from "./contentManager";
import { Window } from "./window";

export type State = {
  window: Window;
  contentManager: ContentManager;
  setCurrentMode(mode: string): void;
};
