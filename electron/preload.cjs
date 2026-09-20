const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('templePrinter', {
  listPrinters: () => ipcRenderer.invoke('printers:list'),
  printHtml: (payload) => ipcRenderer.invoke('printers:print-html', payload),
});
