const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const backend = require('./server')
const net = require('net')
const os = require('os')
// const appDir = path.dirname(app.getAppPath())


let mainWindow

function getIpAddr() {
    const interfaces = os.networkInterfaces()
    for (const dev in interfaces) {
        const alias = interfaces[dev].find(alias => alias.family === 'IPv4' && alias.address !== '127.0.0.1')
        if (alias) {
            return alias.address
        }
    }
    return 'localhost'
}


function createWindow() {
    ipcMain.on('serverIp', (event, arg) => {
        event.returnValue = getIpAddr()
    })
    ipcMain.on('serverPort', (event, arg) => {
        event.returnValue = '8888'
    })

    // mainwindow
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 1000,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    var isDev = process.env.APP_DEV ? (process.env.APP_DEV.trim() == 'true') : false
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000/')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, 'index.html'))
    }

    mainWindow.on('closed', function () {
        mainWindow = null
    })
}


app.on('ready', function () {
    createWindow()
    backend.start(8888)
})
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
})