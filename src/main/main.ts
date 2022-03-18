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

const Store = require('electron-store');
const fs = require('fs');
const xml2js = require('xml2js');
const { execFile } = require('child_process');
const BrowserFS = require('browserfs');

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
    emuPath: '',
    gameDirectory: '',
  },
  WiiU: {
    emuPath: '',
    gameDirectory: '',
  },
  Wii: {
    emuPath: '',
    gameDirectory: 'test',
  },
  GC: {
    emuPath: '',
    gameDirectory: 'test',
  },
  ['3DS']: {
    emuPath: '',
    gameDirectory: '',
  },
  PS2: {
    emuPath: '',
    gameDirectory: '',
  },
  PSP: {
    emuPath: '',
    gameDirectory: '',
  },
  key: '',
};

const store = new Store({ defaults });
const giantBombAPIKey = store.get('key');

console.log(app.getPath('userData'));

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

let switch_db_json = null;
let threeds_db_json = null;
let psp_db_json = require(getAssetPath('pspReleases.json'));

let ps2IdFileExt = [...Array(100).keys()].map(
  (num) => `*.${String(num).padStart(4, '0')}`
);

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

const sortGamesBy = (arr, order, key) => {
  return arr.sort((a, b) => {
    const a_index = order.indexOf(a[key].toString());
    const b_index = order.indexOf(b[key].toString());
    return (a_index == -1 ? 99 : a_index) - (b_index == -1 ? 99 : b_index);
  });
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

const getWiiUGames = async () => {
  let wiiuGames = [];
  const allowedFileExtensions = ['.rpx'];
  const gamePaths = getAllFiles(
    store.get('WiiU.gameDirectory'),
    allowedFileExtensions
  );

  for (const gamePath of gamePaths) {
    let xml_path = path.normalize(
      path.dirname(path.dirname(gamePath)) + '/meta/meta.xml'
    );
    if (fs.existsSync(xml_path)) {
      const wiiu_game_xml = fs.readFileSync(xml_path);
      let wiiu_game_meta_json = null;
      try {
        wiiu_game_meta_json = await xml2js.parseStringPromise(wiiu_game_xml, {
          mergeAttrs: true,
        });
      } catch (err) {
        console.log(err);
        continue;
      }
      const gameName = wiiu_game_meta_json?.menu?.longname_en[0]?.['_'];
      if (gameName) {
        let gameCover = await getCover(gameName, 'WiiU');

        let wiiuSingleGame = {
          name: gameName,
          image: gameCover,
          gamePath,
          gameConsole: 'WiiU',
        };

        wiiuGames.push(wiiuSingleGame);
      }
    }
  }

  return wiiuGames;
};

const getSwitchGames = async () => {
  let switchGames = [];
  const switchMagicWord = 'pfs0';
  const allowedFileExtensions = ['.nsp'];
  const gamePaths = getAllFiles(
    store.get('Switch.gameDirectory'),
    allowedFileExtensions
  );

  if (!switch_db_json) {
    return [];
  }

  let regionOrder = ['USA', 'EUR', 'JPN'];
  switch_db_json.releases.release = sortGamesBy(
    switch_db_json.releases.release,
    regionOrder,
    'region'
  );
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

const get3DSGames = async () => {
  let threedsGames = [];
  const threedsMagicWord = 'ncsd';
  const allowedFileExtensions = ['.3ds', '.cci'];
  const gamePaths = getAllFiles(
    store.get('3DS.gameDirectory'),
    allowedFileExtensions
  );

  if (!threeds_db_json) {
    return [];
  }

  let regionOrder = ['USA', 'EUR', 'JPN'];
  threeds_db_json.releases.release = sortGamesBy(
    threeds_db_json.releases.release,
    regionOrder,
    'region'
  );

  for (const gamePath of gamePaths) {
    let fd = fs.openSync(gamePath, 'r');
    let buffer = Buffer.alloc(16);
    let byteSize = fs.statSync(gamePath).size;
    if (byteSize > 0x110) {
      fs.readSync(fd, buffer, 0, 16, 0x100);
      if (
        buffer.toString('utf-8', 0x0, 0x4).toLowerCase() == threedsMagicWord
      ) {
        // Calculate info
        buffer.swap64();
        const gameID = buffer.toString('hex', 0x8, 0x10);
        for (const game of threeds_db_json.releases.release) {
          if (game.titleid.toString().toLowerCase().includes(gameID)) {
            let gameCover = await getCover(game.name.toString(), '3DS');

            let threedsSingleGame = {
              name: game.name.toString(),
              image: gameCover,
              gamePath,
              gameConsole: '3DS',
            };

            threedsGames.push(threedsSingleGame);
            break;
          }
        }
      }
    }
  }
  return threedsGames;
};

const readableToString = async (readable) => {
  let result = '';
  for await (const chunk of readable) {
    result += chunk;
  }
  return result;
};

const getPS2Games = async () => {
  let ps2Games = [];
  const allowedFileExtensions = ['.iso'];
  const gamePaths = getAllFiles(
    store.get('PS2.gameDirectory'),
    allowedFileExtensions
  );

  // await Promise.allSettled(
  //   gamePaths.map((gamePath) => {
  //     return new Promise((resolve, reject) => {
  //       //here our function should be implemented
  //       console.log('reading iso...');
  //       fs.readFile(gamePath, { encoding: 'buffer' }, (err, data) => {
  //         if (err) throw err;
  //         console.log('read iso!');
  //         BrowserFS.configure(
  //           {
  //             fs: 'IsoFS',
  //             options: {
  //               data,
  //             },
  //           },
  //           (e) => {
  //             console.log('browserfs ready!');
  //             if (e) {
  //               console.log(e);
  //               reject(new Error(`Error occured during reading: ${e}`));
  //             }

  //             const stringData = fs.readFileSync('SYSTEM.CNF', 'utf-8', 'r');
  //             console.log(`${path.basename(gamePath)}: ${stringData}`);
  //             resolve();
  //           }
  //         );
  //       });
  //     });
  //   })
  // );
  console.log('Finished!');

  return [];
};

const getPSPGames = async () => {
  const standardISO9660Identifier = 'cd001';
  const pspMagicWord = 'psp game';
  let pspGames = [];
  const allowedFileExtensions = ['.iso'];
  const gamePaths = getAllFiles(
    store.get('PSP.gameDirectory'),
    allowedFileExtensions
  );

  for (const gamePath of gamePaths) {
    let fd = fs.openSync(gamePath, 'r');
    let buffer = Buffer.alloc(893);
    let byteSize = fs.statSync(gamePath).size;

    // The first 32 KiB is the unused sector of the ISO9660 file system
    // The next 2048 bytes is the first Volume Descriptor on the PS2 game (Primary Volume Descriptor)
    if (byteSize > 32768 + 2048) {
      fs.readSync(fd, buffer, 0, 893, 32768);
      if (
        buffer.readInt8(0) == 1 &&
        buffer.toString('utf-8', 0x01, 0x06).toLowerCase() ==
          standardISO9660Identifier &&
        buffer.toString('utf-8', 0x08, 0x10).toLowerCase() == pspMagicWord
      ) {
        const gameID = buffer.toString('utf-8', 0x373, 0x37d);

        for (const game of psp_db_json) {
          if (game.id.toLowerCase().includes(gameID.toLowerCase())) {
            let gameCover = await getCover(game.name, 'PSP');

            let pspSingleGame = {
              name: game.name,
              image: gameCover,
              gamePath,
              gameConsole: 'PSP',
            };

            pspGames.push(pspSingleGame);
            break;
          }
        }
      }
    }
  }

  return pspGames;
};

// GAME EXECUTION METHODS START //

ipcMain.handle('exec-switch', async (event, arg) => {
  const emuPath = store.get(`${arg.gameConsole}.emuPath`);
  execFile(emuPath, ['-f', '-g', arg.gamePath], (err, stdout, stderr) => {
    event.sender.send('game-ended', {
      name: arg.name,
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
      name: arg.name,
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
        name: arg.name,
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
      name: arg.name,
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
      name: arg.name,
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
      name: arg.name,
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

const loadDatabases = async () => {
  const switch_db_xml = fs.readFileSync(getAssetPath('NSWreleases.xml'));

  try {
    switch_db_json = await xml2js.parseStringPromise(switch_db_xml, {
      mergeAttrs: true,
    });

    // // convert it to a JSON string
    // switch_db_json = JSON.stringify(result, null, 4);
  } catch (err) {
    console.log(err);
  }

  const threeds_db_xml = fs.readFileSync(getAssetPath('3dsreleases.xml'));

  try {
    threeds_db_json = await xml2js.parseStringPromise(threeds_db_xml, {
      mergeAttrs: true,
    });

    // // convert it to a JSON string
    // switch_db_json = JSON.stringify(result, null, 4);
  } catch (err) {
    console.log(err);
  }
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
  .then(async () => {
    await loadDatabases();
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
