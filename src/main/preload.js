const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  ipcRenderer: {
    on(channel, func) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    once(channel, func) {
      ipcRenderer.once(channel, (event, ...args) => func(...args));
    },
    removeAllListeners() {
      ipcRenderer.removeAllListeners();
    },
  },
  execWii: async (gameInfo) => {
    return await ipcRenderer.invoke('exec-wii-gamecube', gameInfo);
  },
  execGC: async (gameInfo) => {
    return await ipcRenderer.invoke('exec-wii-gamecube', gameInfo);
  },
  execSwitch: async (gameInfo) => {
    return await ipcRenderer.invoke('exec-switch', gameInfo);
  },
  execWiiU: async (gameInfo) => {
    return await ipcRenderer.invoke('exec-wii-u', gameInfo);
  },
  exec3DS: async (gameInfo) => {
    return await ipcRenderer.invoke('exec-3ds', gameInfo);
  },
  execDS: async (gameInfo) => {
    return await ipcRenderer.invoke('exec-ds', gameInfo);
  },
  execGBA: async (gameInfo) => {
    return await ipcRenderer.invoke('exec-gba', gameInfo);
  },
  execPS2: async (gameInfo) => {
    return await ipcRenderer.invoke('exec-ps2', gameInfo);
  },
  execPSP: async (gameInfo) => {
    return await ipcRenderer.invoke('exec-psp', gameInfo);
  },
  getGames: async (gameConsole, callback) => {
    let games = await ipcRenderer.invoke('get-games', gameConsole);
    callback(games);
  },
  setEmulatorPath: (gameConsole, emuPath) => {
    return ipcRenderer.invoke('set-emu-path', { gameConsole, emuPath });
  },
  setGameDirectory: (gameConsole, gameDirectory) => {
    return ipcRenderer.invoke('set-game-directory', {
      gameConsole,
      gameDirectory,
    });
  },
});
