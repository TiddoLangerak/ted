import net from "net";
import path from "path";
import { spawn } from "child_process";
import fs from "fs";
import mkdirp from "mkdirp";
import { SOCKET_PATH, SERVER_LOG_PATH } from "../paths";
import { socketIsActive } from "../socketManager";
import { messageParser, sendMessage, MessageType } from "../protocol";
import { error, log, initScreenLogger } from "./screenLogger";
import keyboardProcessor from "./keyboardProcessor";
import window, { Window } from "./window";
import contentManagerFactory, { ContentManager } from "./contentManager";
import { initialMode } from "./modes";
import statusLine from "./statusLine";
import { registerCommand, registerAsDrawable as registerCommandDispatcherAsDrawable } from "./commandDispatcher";
import promisify from "../promisify";
import { Screen } from "./screen";
import { getStdio } from "./stdio";

(async function run() {
  const stdio = getStdio();
  const screen = new Screen(stdio.ttyOut);
  initScreenLogger(screen);

  // If the socket isn't active yet then that means there isn't any server yet. In that case we'll
  // start one.
  if (!(await socketIsActive())) {
    await promisify(cb => mkdirp(path.dirname(SERVER_LOG_PATH), cb));
    const serverLog: number = await promisify(cb =>
      fs.open(SERVER_LOG_PATH, "a", 0o666, cb)
    );
    // The node executable may be located at different locations dependening on
    // the system configuration. We do know however that the client itself is
    // started with a valid node executable, hence we can use process.argv[0] to
    // get the executable to node.
    const nodeExecutable = process.argv[0];
    const server = spawn(
      nodeExecutable,
      [path.resolve(__dirname, "../server")],
      {
        stdio: ["ignore", serverLog, serverLog],
        cwd: process.cwd(),
        detached: true
      }
    );
    server.on("exit", () => {
      const msg = `Server died. Check server logs for debugging. File: ${SERVER_LOG_PATH}`;
      error(msg);
      console.error(msg);
      process.exit(1);
    });
    server.unref();
    const timeout = setTimeout(() => {
      console.error("Server did not come online in 5 seconds. Terminating");
      process.exit(1);
    }, 5000);
    await new Promise(resolve => {
      const interval = setInterval(() => {
        fs.access(SOCKET_PATH, fs.constants.F_OK, err => {
          if (!err) {
            clearInterval(interval);
            clearTimeout(timeout);
            resolve();
          }
        });
      }, 50);
    });
  }

  log(`Socket path: ${SOCKET_PATH}`);
  const client = net.connect({ path: SOCKET_PATH }, () => {
    log("Connected to server");
    if (process.argv[2]) {
      const file = path.resolve(process.cwd(), process.argv[2]);
      sendMessage(client, {
        type: MessageType.RPC,
        action: "requestFile",
        arguments: { file }
      });
    }
  });

  const mainWindow = window(screen, "");

  const contentManager = contentManagerFactory(mainWindow, screen, client);
  registerCommand(":w", contentManager.saveBuffer);
  registerCommand(":w!", () => contentManager.saveBuffer(true));
  registerCommand(":q", process.exit);

  // TODO: share this with server.js
  client.on(
    "data",
    messageParser(message => {
      switch (message.type) {
        case MessageType.BUFFER:
          mainWindow.setContent(message.buffer.content);
          mainWindow.file = message.buffer.filePath;
          mainWindow.isDirty = message.buffer.isDirty;
          mainWindow.getCursor().moveTo(0, 0);
          screen.draw();
          break;
        case MessageType.DIFF:
          contentManager.processServerDiff(message);
          break;
        case MessageType.EVENT: {
          const event = Object.assign({}, message);
          delete event.type;
          if (event.event === "saved" && event.file === mainWindow.file) {
            mainWindow.isDirty = false;
            screen.draw();
          }
          log(JSON.stringify(event));
          break;
        }
        case MessageType.ERROR:
          error(message.message);
          screen.draw();
          break;
        default:
          error(`Unkown message type: ${message.type}`);
      }
    })
  );

  client.on("end", () => {
    log("Disconnected");
  });

  // TODO: move this to some other place
  let currentMode = "";
  function getCurrentMode() {
    return currentMode;
  }
  function setCurrentMode(val: string) {
    currentMode = val;
    screen.draw();
  }
  statusLine({ screen, getCurrentMode, window: mainWindow });
  keyboardProcessor(stdio.stdin);
  registerCommandDispatcherAsDrawable(screen);
  initialMode({ window: mainWindow, contentManager, setCurrentMode, getCurrentMode, screen, stdio });

  screen.draw();
})().then(
  () => {},
  err => {
    // eslint-disable-next-line no-console
    console.error(err.message);
    // eslint-disable-next-line no-console
    console.error(err.stack);
    process.exit(-1);
  }
);
