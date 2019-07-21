declare module "ansi-escapes" {
  // This file is incomplete
  function cursorTo(x: number, y?: number): string;
  const eraseLine: string;
  const cursorHide: string;
  const cursorShow: string;
}
