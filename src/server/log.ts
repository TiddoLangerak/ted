function getPrefix(level: LogLevel) {
  const dateString = new Date().toLocaleString("en-GB", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const upperLevel = level.toUpperCase();
  return `[${dateString}] ${upperLevel}:`;
}

export type LogLevel = "info" | "log" | "warn" | "error";

export function log(level: LogLevel, ...msg: unknown[]) {
  const prefix = getPrefix(level);
  let func = level;
  if (func === "info") {
    func = "log";
  }
  // eslint-disable-next-line no-console
  console[func](prefix, ...msg);
}

export const info = (...msg: unknown[]) => log("info", ...msg);
export const warn = (...msg: unknown[]) => log("warn", ...msg);
export const error = (...msg: unknown[]) => log("error", ...msg);

export default info;
