import escapes from 'ansi-escapes';
import layout from './screenLayout';
import { ttyOut } from './stdio';
import { Layer } from "./screenLayout";
import { assertUnreachable } from "../assertUnreachable";

export type Modifier = {
  open: string,
  close: string
};
export type Cell = {
  ch: string,
  modifiers: Set<Modifier>
}

export type Line = Cell[];

export type Buffer = Line[];

let isInitialized = false;


// This will be used to keep track of what is already drawn on screen
let currentRows : string[] = [];
function drawBuffer(buffer: Buffer, forceRedraw = false) {
  const rows : string[] = [];
  buffer.forEach((row, idx) => {
    const rowTokens = [
      escapes.cursorTo(0, idx),
      escapes.eraseLine,
    ];
    let modifiers : Set<Modifier> = new Set();
    row.forEach((cel) => {
      modifiers.forEach((currentMod) => {
        if (!cel.modifiers.has(currentMod)) {
          rowTokens.push(currentMod.close);
        }
      });
      cel.modifiers.forEach((newMod) => {
        if (!modifiers.has(newMod)) {
          rowTokens.push(newMod.open);
        }
      });
      rowTokens.push(cel.ch);
      modifiers = cel.modifiers;
    });
    const tokenString = rowTokens.join('');
    const closeMods = Array.from(modifiers).map(mod => mod.close).join('');
    rows.push(tokenString + closeMods);
  });
  const tokenString = rows
    .filter((row, idx) =>
      // We only draw rows that have actually been changed, unless an explicit forceRedraw has
      // been requested
      forceRedraw || currentRows.length < idx || currentRows[idx] !== row,
    )
    .join('\n');
  ttyOut.write(tokenString);
  currentRows = rows;
}

export function startAlternateBuffer() {
  ttyOut.write('\x1b[?1049h');
  ttyOut.write(escapes.cursorHide);
}

export function closeAlternateBuffer() {
  ttyOut.write('\x1b[?1049l');
  ttyOut.write(escapes.cursorShow);
}

const drawables = new Map();

function getLayerSize(layer: Layer, buffer: Buffer) : number {
  if (typeof layer === 'string') {
    throw new Error("Cannot get the layer size for a string");
  } else if (layer.split === 'vertical') {
    return buffer.length;
  } else if (layer.split === 'horizontal') {
    return buffer[0].length;
  } else {
    return assertUnreachable(layer);
  }
}

function drawLayers(layers: Layer[], buffer: Buffer) {
  layers.forEach((layer) => {
    if (typeof layer === 'string') {
      const drawable = drawables.get(layer);
      if (!drawable) {
        throw new Error(`Couldn't find drawable for layer ${layer}`);
      }
      drawable(buffer);
    } else { // split window
      // Size of the layer in the relevant dimension. I.e. for a vertical split this is the height,
      // for a horizontal split this is the width;
      let layerSize = getLayerSize(layer, buffer);

      // Number of buffers that have an auto height
      const autoCount = layer.buffers.filter(buff => buff.size === 'auto').length;
      // Size already claimed by fixed size parts
      const claimedSize : number = layer.buffers
        .map((buff) => {
          if (typeof buff.size === 'string') {
            return 0;
          }
          return buff.size;
        })
        .reduce((total, more) => total + more, 0);
      const autoSize = Math.floor((layerSize - claimedSize) / autoCount);

      // We need to also keep track of the remainder to prevent empty rows
      // when multiple auto's are given.
      let autoSizeRemainder = (layerSize - claimedSize) % autoCount;

      // We reduce the buffers onto the screen buffers in such a way that each buffer draws onto
      // it's claimed space and then passes the *remainder* of the buffer to the next iteration.
      // This should result in an empty screen buffer when we're done.
      layer.buffers
        .reduce((screenBuffer, buff) => {
          let size = buff.size === 'auto' ? autoSize : buff.size;
          if (buff.size === 'auto' && autoSizeRemainder) {
            size += 1;
            autoSizeRemainder -= 1;
          }

          if (layer.split === 'vertical') {
            const virtualBuffer = screenBuffer.slice(0, size);
            drawLayers(buff.layers, virtualBuffer);
            return screenBuffer.slice(size);
          }  // layer.split === 'horizontal'
          const left : Buffer = [];
          const right : Buffer = [];
          screenBuffer.forEach((line) => {
            left.push(line.slice(0, size));
            right.push(line.slice(size));
          });
          drawLayers(buff.layers, left);
          return right;
        }, buffer);
    }
  });
}


/**
 * @param {Boolean} [immediate] - If true the screen will be drawed immediately. By default the
 *                                screen is updated in the next tick, both for performance and to
 *                                allow temporary invalid states.
 * @param {Boolean} [forceRedraw] - If true the entire screen wil be redrawn. By default only the
 *                                  lines that have been changed will be redrawn, but this may
 *                                  result in glitches when the screen is resized.
 */
export function draw(immediate: boolean = false, forceRedraw: boolean = false) {
  // If we don't need to draw immediately we'll schedule the drawing for the next tick.
  // The main reason for this is to allow the buffers to temporarily be in an invalid state.
  // As long as the invalid state is fixed before the next tick then drawing won't fail.
  if (!immediate) {
    process.nextTick(() => draw(true, forceRedraw));
    return;
  }
  if (!isInitialized) {
    // eslint-disable-next-line no-use-before-define
    initialize();
    isInitialized = true;
  }

  // TODO: instead of letting each drawable drawing directly to the screen they should work on
  // some virtual screen in memory (e.g. an array of lines, or a matrix).
  // The screen class should then do the actual drawing.

  const buffer : Buffer = Array.from(new Array(ttyOut.getRows()), () => Array.from(new Array(ttyOut.getColumns()), () => ({ ch: ' ', modifiers: new Set() })));
  drawLayers(layout, buffer);
  drawBuffer(buffer, forceRedraw);
}

export function registerDrawable(name: string, drawFunction: (buff: Buffer) => unknown) {
  drawables.set(name, drawFunction);
}

function initialize() {
  startAlternateBuffer();

  process.on('exit', () => {
    closeAlternateBuffer();
  });
  process.on('uncaughtException', (e) => {
    closeAlternateBuffer();
    throw e;
  });

  // We force redraw on sigwinch, to prevent glitches
  process.on('SIGWINCH', () => draw(false, true));
}

