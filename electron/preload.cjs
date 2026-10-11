// Мост между игрой и Electron: файловое хранилище, выход, Steam.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('native', {
  platform: 'desktop',
  store: {
    get: (k) => ipcRenderer.sendSync('store:get', k),
    set: (k, v) => ipcRenderer.sendSync('store:set', k, v),
    del: (k) => ipcRenderer.sendSync('store:del', k)
  },
  quit: () => ipcRenderer.send('app:quit'),
  fullscreen: (on) => ipcRenderer.send('app:fullscreen', on),
  achievement: (id) => ipcRenderer.send('steam:achievement', id),
  steamInfo: () => ipcRenderer.sendSync('steam:info'),
  saveImage: (name, data) => ipcRenderer.sendSync('dev:saveImage', name, data)
});
