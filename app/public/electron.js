const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const backend = require('./server')
const net = require('net')

// const appDir = path.dirname(app.getAppPath())


let mainWindow



function createWindow() {
    // mainwindow
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 1000
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