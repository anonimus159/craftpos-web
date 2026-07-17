// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  dbGetAllProducts: () => ipcRenderer.invoke('db-get-all-products'),
  dbSaveProduct: (product) => ipcRenderer.invoke('db-save-product', product),
  dbDeleteProduct: (id) => ipcRenderer.invoke('db-delete-product', id),
  dbSaveSale: (sale) => ipcRenderer.invoke('db-save-sale', sale),
  dbGetSales: () => ipcRenderer.invoke('db-get-sales'),
  dbSaveRegister: (register) => ipcRenderer.invoke('db-save-register', register),
  dbGetRegisters: () => ipcRenderer.invoke('db-get-registers'),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printTicket: (html, printerName) => ipcRenderer.invoke('print-ticket', html, printerName),
  backupDatabase: () => ipcRenderer.invoke('db-backup'),
  restoreDatabase: () => ipcRenderer.invoke('db-restore')
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('POS Multirubro Desktop Preload loaded successfully');
});
