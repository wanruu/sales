const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('electronAPI', {
    queryServerIp: () => ipcRenderer.sendSync('serverIp', 'serverIp'),
    queryServerPort: () => ipcRenderer.sendSync('serverPort', 'serverPort'),
    // handlePort: (callback) => ipcRenderer.on('port', callback)
})