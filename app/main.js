'use strict';

const {shell, app, BrowserWindow} = require('electron');

const http = require('http');
const nodeStatic = require('node-static');
const fs = require('fs');

//const file = new nodeStatic.Server(__dirname + '/web');

let win;

function createWindow() {
    win = new BrowserWindow({
        "width": 1200, "height": 750,
        webPreferences: { nodeIntegration: true }
    });
    win.loadURL('file://' + __dirname + '/index.html');
    win.webContents.openDevTools();

    win.on('closed', function() {
        win = null;
    });
};

app.on('ready', function () {
    createWindow();
});

app.on('window-all-closed', function() {
    // macOSの場合ウィンドウを全部閉じても終了しない
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function() {
    // macOSの場合ウィンドウがないときはドックのアイコンをクリックしてウィンドウを開く
    if (win === null) {
        createWindow();
    }
});
