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
  execWii: async (gamePath) => {
    return await ipcRenderer.invoke('exec-wii-gamecube', gamePath);
  },
  execGC: async (gamePath) => {
    return await ipcRenderer.invoke('exec-wii-gamecube', gamePath);
  },
  execSwitch: async (gamePath) => {
    return await ipcRenderer.invoke('exec-switch', gamePath);
  },
  execWiiU: async (gamePath) => {
    return await ipcRenderer.invoke('exec-wii-u', gamePath);
  },
  exec3DS: async (gamePath) => {
    return await ipcRenderer.invoke('exec-3ds', gamePath);
  },
  execPS2: async (gamePath) => {
    return await ipcRenderer.invoke('exec-ps2', gamePath);
  },
  execPSP: async (gamePath) => {
    return await ipcRenderer.invoke('exec-psp', gamePath);
  },
  getGames: async (gameConsole, callback) => {
    let games = await ipcRenderer.invoke('get-games', gameConsole);
    callback(games);
  },
});
