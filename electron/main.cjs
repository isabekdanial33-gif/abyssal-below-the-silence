// Electron-оболочка ABYSSAL: окно, полноэкранный режим, файловые сохранения (Steam Cloud),
// интеграция Steamworks (достижения, оверлей) с безопасным откатом, если Steam не запущен.
const { app, BrowserWindow, ipcMain, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_ID = Number(process.env.ABYSSAL_STEAM_APPID || readAppId() || 0);
function readAppId() {
  try {
    return fs.readFileSync(path.join(path.dirname(process.execPath), 'steam_appid.txt'), 'utf8').trim();
  } catch {
    return null;
  }
}

let steam = null;
try {
  if (APP_ID) {
    const sw = require('steamworks.js');
    steam = sw.init(APP_ID);
    sw.electronEnableSteamOverlay();
    console.log('[Steam] подключено, appid', APP_ID, 'игрок', steam.localplayer.getName());
  }
} catch (e) {
  console.log('[Steam] недоступен:', e.message);
  steam = null;
}

const saveDir = () => {
  const d = path.join(app.getPath('userData'), 'saves');
  fs.mkdirSync(d, { recursive: true });
  return d;
};
const safeName = (k) => String(k).replace(/[^a-z0-9._-]/gi, '_') + '.json';

ipcMain.on('store:get', (e, key) => {
  try {
    e.returnValue = fs.readFileSync(path.join(saveDir(), safeName(key)), 'utf8');
  } catch {
    e.returnValue = null;
  }
});
ipcMain.on('store:set', (e, key, val) => {
  try {
    const f = path.join(saveDir(), safeName(key));
    fs.writeFileSync(f + '.tmp', val);
    fs.renameSync(f + '.tmp', f);
    e.returnValue = true;
  } catch {
    e.returnValue = false;
  }
});
ipcMain.on('store:del', (e, key) => {
  try {
    fs.unlinkSync(path.join(saveDir(), safeName(key)));
  } catch {
    /* нет файла */
  }
  e.returnValue = true;
});
ipcMain.on('app:quit', () => app.quit());
ipcMain.on('app:fullscreen', (e, on) => BrowserWindow.fromWebContents(e.sender)?.setFullScreen(!!on));
ipcMain.on('steam:achievement', (e, id) => {
  try {
    if (steam && !steam.achievement.isActivated(id)) steam.achievement.activate(id);
  } catch (err) {
    console.log('[Steam] достижение', id, err.message);
  }
});
ipcMain.on('steam:info', (e) => {
  e.returnValue = steam ? { ok: true, name: steam.localplayer.getName(), lang: app.getLocale() } : { ok: false, lang: app.getLocale() };
});
ipcMain.on('dev:saveImage', (e, name, dataUrl) => {
  const out = path.join(__dirname, '..', 'steam', 'store', name);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
  e.returnValue = out;
});

function create() {
  // окно по рабочей области экрана (на ноутбуках с масштабом 125–150% 1600×900 не помещается), сразу во весь экран
  const wa = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width: Math.min(1600, wa.width), height: Math.min(900, wa.height), minWidth: 800, minHeight: 500, backgroundColor: '#000000', autoHideMenuBar: true,
    fullscreen: !process.argv.includes('--windowed'), useContentSize: true,
    title: 'ABYSSAL: Below the Silence', icon: path.join(__dirname, 'icon.png'), show: false,
    webPreferences: { backgroundThrottling: false, preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true }
  });
  win.setMenuBarVisibility(false);
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  const capture = process.argv.includes('--capture') ? '?capture=1' : '';
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), { search: capture });
}
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
