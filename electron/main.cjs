const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
};

ipcMain.handle('printers:list', async (event) => {
  return event.sender.getPrintersAsync();
});

ipcMain.handle('printers:print-html', async (event, payload) => {
  if (!payload || typeof payload.html !== 'string') {
    throw new Error('Printable HTML is required.');
  }

  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(payload.html)}`);
    const options = {
      silent: Boolean(payload.silent),
      printBackground: true,
      deviceName: payload.deviceName || undefined,
      margins: { marginType: 'none' },
    };

    return await new Promise((resolve, reject) => {
      printWindow.webContents.print(options, (success, reason) => {
        if (!success) reject(new Error(reason || 'The printer rejected the job.'));
        else resolve({ success: true });
      });
    });
  } finally {
    if (!printWindow.isDestroyed()) printWindow.close();
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
