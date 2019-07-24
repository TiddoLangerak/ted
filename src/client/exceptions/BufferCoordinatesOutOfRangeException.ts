import { BufferCoordinates } from "../cursor";
import { Window } from "../window";

export class BufferCoordinatesOutOfRangeException extends Error {
  constructor(coordinates: BufferCoordinates, window: Window) {
    const range = {
      lines: window.getLines().length,
      columns: window.getLines()[coordinates.y] && window.lineLength(coordinates.y)
    };
    super(`The coordinates (x:${coordinates.x}, y:${coordinates.y}) are out of range (lines: ${range.lines}, columns: ${range.columns})`);
  }
}
