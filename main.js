const {app, BrowserWindow, Menu, protocol, ipcMain} = require('electron');
const log = require('electron-log');
const {autoUpdater} = require("electron-updater");
const path = require('path');
const url = require('url');

//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

//-------------------------------------------------------------------
// Define the menu
//
// THIS SECTION IS NOT REQUIRED
//-------------------------------------------------------------------
let template = []
if (process.platform == 'darwin') {
  // OS X
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        label: 'About ' + name,
        role: 'about'
      },
      {
        label: 'Toggle Debugger',
        accelerator: 'Command+D',
        click() { win.webContents.toggleDevTools(); }
      },
      {
        label: 'Check for Updates',
        accelerator: 'Command+U',
        click() { sendStatusToWindow('Checking'); autoUpdater.checkForUpdatesAndNotify(); }
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() { app.quit(); }
      },
    ]
  })
}



let win;
let deeplinkProtocol = "chathealth";
let deeplinkingUrl;

var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {

  if (process.platform == 'win32') {
    // Keep only command line / deep linked arguments
    console.log("Deep linking hit:", deeplinkingUrl);
    deeplinkingUrl = process.argv.slice(1);
  
  _performDeepLink(commandLine[1]);
  }

  // Someone tried to run a second instance, we should focus our window.
  if (win) {

    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

if (shouldQuit) {
  app.quit();
  return;
}

function sendStatusToWindow(text) {
  log.info(text);
  win.webContents.send('message', text);
}

function createDefaultWindow() {
  win = new BrowserWindow({ width: 1600, height: 900, center: true });
  // win.maximize();
  
  win.webContents.executeJavaScript(`window.localStorage.setItem("appVersion", "${app.getVersion()}")`);

  win.on('closed', () => {
    win = null;
  });

  win.webContents.openDevTools();

  //win.loadURL(`file://${__dirname}/version.html#v${app.getVersion()}`);
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  return win;
}

function toggleDebugger() {
  win.webContents.toggleDevTools(); 
}

//-------------------------------------------------------------------
// Open a window that displays the version
//
// THIS SECTION IS NOT REQUIRED
//
// This isn't required for auto-updates to work, but it's easier
// for the app to show a window than to have to click "About" to see
// that updates are working.
//-------------------------------------------------------------------

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});


autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
});


autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
});


autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
});


autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
});


autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
});


app.on('ready', function() {
  // Create the Menu
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  
  autoUpdater.checkForUpdatesAndNotify();

  createDefaultWindow();

  win.webContents.on("did-get-redirect-request", (e, oldUrl, newUrl, isMainFrame, httpResponseCode, requestMethod, refeerrer, header) => {

    const queryParamsAsString = newUrl.substring(newUrl.indexOf("?"));
    const queryParamsAsObj = _getQueryStringParams(queryParamsAsString);

    if (queryParamsAsObj.code) {

      win.loadURL(`file://${__dirname}/index.html?code=${queryParamsAsObj.code}&state=${queryParamsAsObj.state}`)
    }
  });
});


app.on('window-all-closed', () => {
  app.quit();
});

//
// CHOOSE one of the following options for Auto updates
//

//-------------------------------------------------------------------
// Auto updates - Option 1 - Simplest version
//
// This will immediately download an update, then install when the
// app quits.
//-------------------------------------------------------------------
app.on('ready', function()  {
  autoUpdater.checkForUpdatesAndNotify();
});

//-------------------------------------------------------------------
// Auto updates - Option 2 - More control
//
// For details about these events, see the Wiki:
// https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
//
// The app doesn't need to listen to any events except `update-downloaded`
//
// Uncomment any of the below events to listen for them.  Also,
// look in the previous section to see them being used.
//-------------------------------------------------------------------
// app.on('ready', function()  {
//   autoUpdater.checkForUpdates();
// });
// autoUpdater.on('checking-for-update', () => {
// })
// autoUpdater.on('update-available', (info) => {
// })
// autoUpdater.on('update-not-available', (info) => {
// })
// autoUpdater.on('error', (err) => {
// })
// autoUpdater.on('download-progress', (progressObj) => {
// })
// autoUpdater.on('update-downloaded', (info) => {
//   autoUpdater.quitAndInstall();  
// })


// Define custom protocol handler. Deep linking works on packaged versions of the application!
app.setAsDefaultProtocolClient(deeplinkProtocol);

// Protocol handler for osx
app.on('open-url', function (event, url) {

  event.preventDefault();
  deeplinkingUrl = url;
  _performDeepLink(url);
});

function _performDeepLink(url) {

  if (url.includes("chathealth")) {

    console.log(url);

    const parsedUrl = _validateDeepLink(url);

    if (parsedUrl) {

      const queryParams = _getQueryStringParams(parsedUrl);

      if (queryParams.conversationId) {

        console.log("Query:", queryParams.conversationId);

        win.webContents.executeJavaScript(`wc.router.goToView({ tag: "view-deep-linking", title: "ChatHealth", uri: "dl", auth: true }, { conversationId: "${queryParams.conversationId}" })`);
      }
    }
  }
}

function _validateDeepLink(url) {

  url = url.replace(`${deeplinkProtocol}://`, "");
  
  if (url.substring(0, 2) === "dl") {
  
  // For Windows Electron
  url = url.replace("/", "");

    return url.replace("dl", "");
  }
  else {

    return "";
  }
}

function _getQueryStringParams(url) {

  let match;
  const pl = /\+/g;
  const search = /([^&=]+)=?([^&]*)/g;
  const decode = (str) => decodeURIComponent(str.replace(pl, " "));
  const query = url;

  const params = {};

  while (match = search.exec(query)) {

      params[decode(match[1]).replace("?", "")] = decode(match[2]);
  }

  return params;
}