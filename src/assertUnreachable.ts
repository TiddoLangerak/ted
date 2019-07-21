export function assertUnreachable(x: never): never {
  throw new Error(`Unreacable code reached with object: ${x}`);
}
