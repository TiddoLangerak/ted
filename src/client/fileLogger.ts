import fs from "fs";
import util from "util";

export default function(msg: unknown) {
  let log;
  if (typeof msg !== "string") {
    log = util.inspect(msg);
  } else {
    log = msg;
  }
  fs.appendFileSync(`${process.cwd()}/log`, `${log}\n`);
}
