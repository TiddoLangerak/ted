import styles from "ansi-styles";
import {
  createSegment,
  fixedLength,
  writeIntoBuffer
} from "./screenBufferUtils";
import { Window } from "./window";
import { Screen } from "./screen";

type StatusLineArgs = {
  window: Window;
  getCurrentMode(): string;
  screen: Screen;
};
export default function createStatusLine({
  getCurrentMode,
  window,
  screen
}: StatusLineArgs) {
  const statusLineBg = styles.bgBlue;
  const statusLineMods = new Set([statusLineBg]);
  const modeMods = new Set([statusLineBg, styles.bold]);
  const statusLineModifiers = new Set([statusLineBg]);
  const statusLineOpts = {
    modifiers: statusLineModifiers,
    fillerModifiers: statusLineModifiers
  };
  screen. registerDrawable("STATUS_LINE", buffer => {
    let leftSegment = [
      ...createSegment(getCurrentMode().toUpperCase(), modeMods),
      ...createSegment(" | ", statusLineMods)
    ];
    const cursor = window.getCursor();
    const rightSegment = createSegment(
      `${cursor.y}:${cursor.x}`,
      statusLineMods
    );

    const fileNameSpace = Math.max(
      0,
      buffer[0].length - leftSegment.length - rightSegment.length
    );
    const fileName = window.file || "";
    // We provide the second argument as well such that when fileNameSpace === 0
    // we get the empty string
    const visibleFileName = fileName.substr(-fileNameSpace, fileNameSpace);

    const fileNameMods = new Set(statusLineOpts.modifiers);
    if (window.isDirty) {
      fileNameMods.add(styles.red);
    }
    const fileNameSegment = createSegment(visibleFileName, fileNameMods);
    leftSegment = [...leftSegment, ...fileNameSegment];

    const fillerLength = Math.max(
      0,
      buffer[0].length - leftSegment.length - rightSegment.length
    );
    const filler = fixedLength("", fillerLength, statusLineOpts);

    const statusLine = [...leftSegment, ...filler, ...rightSegment];

    writeIntoBuffer([statusLine], buffer);
  });
}
