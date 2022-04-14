const { app, BrowserWindow } = require('electron')
const Store = require('electron-store');
const store = new Store();
const { updateEmailList } = require('./service.js')
const { ipcMain } = require('electron')
const path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // and load the index.html of the app.
    win.loadFile('index.html')

    // Open the DevTools.

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })

}
function executeJob() {
    console.info('I am running =====>')

    const storeData = {
        email_list_id: store.get('email_list_id') || '',
        csv_directory_path: store.get('csv_directory_path') || '/',
    }
    updateEmailList(storeData)
}
ipcMain.on('changeCSVDirectory', (event, path) => {
    const { dialog } = require('electron')
    const fs = require('fs')
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }).then((res) => {
        if (!res.canceled) {
            event.sender.send('changeCSVDirectoryPath', res.filePaths[0])
        }
    });
})
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
    var CronJob = require('cron').CronJob;
    new CronJob('0 */10 * * * *', function () {
        executeJob()
    }, null, true, 'America/Los_Angeles');
    createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})
ipcMain.on('changeStoreData', (event, arg) => {
    store.set('csv_directory_path', arg.csv_directory_path);
    store.set('email_list_id', arg.email_list_id)
    executeJob()
})
ipcMain.on('getStoreData', (event, arg) => {
    sendStoreData(event)
})
sendStoreData = (event) => {
    const storeData = {
        email_list_id: store.get('email_list_id') || '',
        csv_directory_path: store.get('csv_directory_path') || '/',
    }
    event.sender.send('changeStoreData', storeData)
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.