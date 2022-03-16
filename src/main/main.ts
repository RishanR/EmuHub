/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import axios from 'axios';
import { URL } from 'url';
import { resolveHtmlPath } from './util';

// npm i sqlite3

const Store = require('electron-store');
const fs = require('fs');
const xml2js = require('xml2js');
const { execFile } = require('child_process');

const giantBombUrl = 'https://www.giantbomb.com';
const giantBombPlatformIDs = {
  Wii: 36,
  WiiU: 139,
  Switch: 157,
  ['3DS']: 117,
  GC: 23,
  PS2: 19,
  PSP: 18,
};

const defaults = {
  Switch: {
    emuPath:
      'C:\\Users\\Rishan\\AppData\\Local\\yuzu\\yuzu-windows-msvc\\yuzu.exe',
    gameDirectory: '',
  },
  WiiU: {
    emuPath:
      'D:\\Documents - Data Drive\\My Games\\Wii U Games\\cemu_1.20.2\\Cemu.exe',
    gameDirectory: '',
  },
  Wii: {
    emuPath:
      'D:\\Documents - Data Drive\\My Games\\Wii and Gamecube Games\\Dolphin-x64\\Dolphin.exe',
    gameDirectory: 'test',
  },
  GC: {
    emuPath:
      'D:\\Documents - Data Drive\\My Games\\Wii and Gamecube Games\\Dolphin-x64\\Dolphin.exe',
    gameDirectory: 'test',
  },
  ['3DS']: {
    emuPath: 'D:\\Program Files (x86)\\Citra\\nightly-mingw\\citra-qt.exe',
    gameDirectory: '',
  },
  PS2: {
    emuPath: 'D:\\Program Files (x86)\\PCSX2 1.4.0\\pcsx2.exe',
    gameDirectory: '',
  },
  PSP: {
    emuPath: 'D:\\Program Files\\PPSSPP\\PPSSPPWindows64.exe',
    gameDirectory: '',
  },
  key: '',
};

const store = new Store({ defaults });
const giantBombAPIKey = store.get('key');

console.log(app.getPath('userData'));

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const getExecMessage = (err, gamePath, emuPath) => {
  if (err) {
    // Just printing to console for testing
    console.log(err);
    return {
      error: {
        code: err.code,
        filename: path.basename(emuPath),
        gamepath: gamePath,
      },
      message: `ended ${path.basename(emuPath)} game`,
    };
  }
  return {
    error: null,
    message: `ended ${path.basename(emuPath)} game`,
  };
};

const getAllFiles = function (
  dirPath,
  allowedFileExtensions,
  currentArrayOfFiles = []
) {
  let files = fs.readdirSync(dirPath);

  let arrayOfFiles = currentArrayOfFiles;

  files.forEach(function (file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(
        dirPath + '/' + file,
        allowedFileExtensions,
        arrayOfFiles
      );
    } else {
      if (allowedFileExtensions.includes(path.extname(file).toLowerCase())) {
        arrayOfFiles.push(path.join(dirPath, '/', file));
      }
    }
  });

  return arrayOfFiles;
};

const getCover = async (gameName, gamePlatform) => {
  const result = await axios(
    new URL(
      `${giantBombUrl}/api/search/?api_key=${giantBombAPIKey}&format=json&query=${gameName}&resources=game&field_list=platforms,image&page=1&limit=10`
    ).toString()
  );
  // console.log(result.data.results.platforms);
  const filteredArray = result.data.results
    .filter((game) => {
      if (Object.prototype.toString.call(game.platforms) == '[object Array]') {
        for (const platform of game.platforms) {
          if (platform.id == giantBombPlatformIDs[gamePlatform]) {
            return true;
          }
        }
      }
      return false;
    })
    .map((game) => game.image.super_url);

  return filteredArray[0];
};

const getWiiGames = async () => {
  let wiiGames = [];
  const wiiMagicWord = '5d1c9ea3';
  const allowedFileExtensions = ['.iso', '.wbfs'];
  const gamePaths = getAllFiles(
    store.get('Wii.gameDirectory'),
    allowedFileExtensions
  );

  for (const gamePath of gamePaths) {
    let fd = fs.openSync(gamePath, 'r');
    let buffer = Buffer.alloc(96);
    let byteSize = fs.statSync(gamePath).size;
    let extension = path.extname(gamePath);
    if (
      (extension == '.iso' && byteSize > 96) ||
      (extension == '.wbfs' && byteSize > 608)
    ) {
      fs.readSync(fd, buffer, 0, 96, extension == '.iso' ? 0 : 512);
      if (buffer.toString('hex', 0x018, 0x01c).toLowerCase() == wiiMagicWord) {
        // Valid Game. From here do what you need to create the game object and then push it into a games array

        let gameName = buffer
          .toString('utf-8', 0x020, 0x060)
          .replace(/\0.*$/g, '');

        let gameCover = await getCover(gameName, 'Wii');

        let wiiSingleGame = {
          name: gameName,
          image: gameCover,
          gamePath,
          gameConsole: 'Wii',
        };

        wiiGames.push(wiiSingleGame);
      }
    }
  }

  return wiiGames;
};

const getGCGames = async () => {
  let gcGames = [];
  const gcMagicWord = 'c2339f3d';
  const allowedFileExtensions = ['.iso', '.gcm'];
  const gamePaths = getAllFiles(
    store.get('GC.gameDirectory'),
    allowedFileExtensions
  );

  for (const gamePath of gamePaths) {
    let fd = fs.openSync(gamePath, 'r');
    let buffer = Buffer.alloc(96);
    let byteSize = fs.statSync(gamePath).size;
    if (byteSize > 96) {
      fs.readSync(fd, buffer, 0, 96, 0);
      if (buffer.toString('hex', 0x01c, 0x020).toLowerCase() == gcMagicWord) {
        // Valid Game. From here do what you need to create the game object and then push it into a games array

        let gameName = buffer
          .toString('utf-8', 0x020, 0x060)
          .replace(/\0.*$/g, '');

        let gameCover = await getCover(gameName, 'GC');

        let gcSingleGame = {
          name: gameName,
          image: gameCover,
          gamePath,
          gameConsole: 'GC',
        };

        gcGames.push(gcSingleGame);
      }
    }
  }
  return gcGames;
};

const getWiiUGames = () => {
  return [];
};

const getSwitchGames = async () => {
  let switchGames = [];
  const switchMagicWord = 'pfs0';
  const allowedFileExtensions = ['.nsp'];
  const gamePaths = getAllFiles(
    store.get('Switch.gameDirectory'),
    allowedFileExtensions
  );

  const switch_db_xml = fs.readFileSync(getAssetPath('NSWreleases.xml'));
  let switch_db_json = null;

  try {
    switch_db_json = await xml2js.parseStringPromise(switch_db_xml, {
      mergeAttrs: true,
    });

    // // convert it to a JSON string
    // switch_db_json = JSON.stringify(result, null, 4);
  } catch (err) {
    console.log(err);
    return [];
  }
  // console.log(switch_db_json.releases);
  // fs.writeFileSync(getAssetPath('NSWreleases.json'));

  for (const gamePath of gamePaths) {
    let fd = fs.openSync(gamePath, 'r');
    let buffer = Buffer.alloc(16);
    let byteSize = fs.statSync(gamePath).size;
    if (byteSize > 16) {
      fs.readSync(fd, buffer, 0, 16, 0);
      if (buffer.toString('utf-8', 0x0, 0x4).toLowerCase() == switchMagicWord) {
        // Calculate info

        const game_id_offset = 0x5b;
        const num_of_files = buffer.readInt32LE(0x4);
        const string_table_size = buffer.readInt32LE(0x8);

        const string_table_offset = 0x10 + 0x18 * num_of_files;
        const data_offset = string_table_offset + string_table_size;

        let idBuffer = Buffer.alloc(16);
        fs.readSync(fd, idBuffer, 0, 16, data_offset + game_id_offset);
        const gameID = idBuffer.toString('utf-8');
        for (const game of switch_db_json.releases.release) {
          if (
            game.titleid
              .toString()
              .replaceAll(',-', '0100')
              .replace(/-/g, '')
              .toLowerCase()
              .includes(gameID)
          ) {
            let gameCover = await getCover(game.name.toString(), 'Switch');

            let switchSingleGame = {
              name: game.name.toString(),
              image: gameCover,
              gamePath,
              gameConsole: 'Switch',
            };

            switchGames.push(switchSingleGame);
            break;
          }
        }
      }
    }
  }
  return switchGames;
};

const get3DSGames = () => {
  return [];
};

const getPS2Games = () => {
  return [];
};

const getPSPGames = () => {
  return [];
};

// GAME EXECUTION METHODS START //

ipcMain.handle('exec-switch', async (event, arg) => {
  const emuPath = store.get(`${arg.gameConsole}.emuPath`);
  execFile(emuPath, ['-f', '-g', arg.gamePath], (err, stdout, stderr) => {
    event.sender.send('game-ended', {
      index: arg.index,
      gameConsole: arg.gameConsole,
      output: getExecMessage(err, arg.gamePath, emuPath),
    });
  });
  return `started ${path.basename(emuPath)} game`;
});

ipcMain.handle('exec-wii-u', async (event, arg) => {
  const emuPath = store.get(`${arg.gameConsole}.emuPath`);
  execFile(emuPath, ['-f', '-g', arg.gamePath], (err, stdout, stderr) => {
    event.sender.send('game-ended', {
      index: arg.index,
      gameConsole: arg.gameConsole,
      output: getExecMessage(err, arg.gamePath, emuPath),
    });
  });
  return `started ${path.basename(emuPath)} game`;
});

ipcMain.handle('exec-wii-gamecube', async (event, arg) => {
  const emuPath = store.get(`${arg.gameConsole}.emuPath`);
  execFile(
    emuPath,
    [
      '--batch',
      `--exec=${arg.gamePath}`,
      '--config=Dolphin.Display.Fullscreen=True',
    ],
    (err, stdout, stderr) => {
      event.sender.send('game-ended', {
        index: arg.index,
        gameConsole: arg.gameConsole,
        output: getExecMessage(err, arg.gamePath, emuPath),
      });
    }
  );
  return `started ${path.basename(emuPath)} game`;
});

ipcMain.handle('exec-3ds', async (event, arg) => {
  const emuPath = store.get(`${arg.gameConsole}.emuPath`);
  execFile(emuPath, [arg.gamePath], (err, stdout, stderr) => {
    event.sender.send('game-ended', {
      index: arg.index,
      gameConsole: arg.gameConsole,
      output: getExecMessage(err, arg.gamePath, emuPath),
    });
  });
  return `started ${path.basename(emuPath)} game`;
});

ipcMain.handle('exec-ps2', async (event, arg) => {
  const emuPath = store.get(`${arg.gameConsole}.emuPath`);
  execFile(emuPath, [arg.gamePath, '--fullscreen'], (err, stdout, stderr) => {
    event.sender.send('game-ended', {
      index: arg.index,
      gameConsole: arg.gameConsole,
      output: getExecMessage(err, arg.gamePath, emuPath),
    });
  });
  return `started ${path.basename(emuPath)} game`;
});

ipcMain.handle('exec-psp', async (event, arg) => {
  const emuPath = store.get(`${arg.gameConsole}.emuPath`);
  execFile(emuPath, [arg.gamePath, '--fullscreen'], (err, stdout, stderr) => {
    event.sender.send('game-ended', {
      index: arg.index,
      gameConsole: arg.gameConsole,
      output: getExecMessage(err, arg.gamePath, emuPath),
    });
  });
  return `started ${path.basename(emuPath)} game`;
});

// GAME EXECUTION METHODS END //

ipcMain.handle('get-games', async (event, arg) => {
  let emuPath = true;
  let gameDirectory = true;
  if (!store.get(`${arg}.emuPath`)) {
    emuPath = false;
  }
  if (!store.get(`${arg}.gameDirectory`)) {
    gameDirectory = false;
  }
  // Get Games of the specified console
  if (emuPath && gameDirectory) {
    let results = await eval(`get${arg}Games()`);
    return {
      emuPath,
      gameDirectory,
      results,
    };
  }
  return {
    emuPath,
    gameDirectory,
    results: [],
  };
});

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};
const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
