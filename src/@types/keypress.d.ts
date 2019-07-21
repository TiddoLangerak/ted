// Type definitions for Keypress v2.0.3
// Project: https://github.com/dmauro/Keypress/
// Definitions by: Roger Chen <https://github.com/rcchen>
// Altered by: Tiddo Langerak



declare module "keypress" {
  import { Readable } from 'stream';
  function keypress(stdin: Readable): void;
  export = keypress;
}

