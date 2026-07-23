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
  restoreDatabase: () => ipcRenderer.invoke('db-restore'),
  
  // Clients
  dbGetAllClients: () => ipcRenderer.invoke('db-get-all-clients'),
  dbSaveClient: (client) => ipcRenderer.invoke('db-save-client', client),
  dbDeleteClient: (id) => ipcRenderer.invoke('db-delete-client', id),

  // Suppliers
  dbGetAllSuppliers: () => ipcRenderer.invoke('db-get-all-suppliers'),
  dbSaveSupplier: (supplier) => ipcRenderer.invoke('db-save-supplier', supplier),
  dbDeleteSupplier: (id) => ipcRenderer.invoke('db-delete-supplier', id),

  // Quotes
  dbGetAllQuotes: () => ipcRenderer.invoke('db-get-all-quotes'),
  dbSaveQuote: (quote) => ipcRenderer.invoke('db-save-quote', quote),
  dbDeleteQuote: (id) => ipcRenderer.invoke('db-delete-quote', id),

  // Purchase Orders
  dbGetAllPurchaseOrders: () => ipcRenderer.invoke('db-get-all-purchase-orders'),
  dbSavePurchaseOrder: (order) => ipcRenderer.invoke('db-save-purchase-order', order),
  dbDeletePurchaseOrder: (id) => ipcRenderer.invoke('db-delete-purchase-order', id)
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('POS Multirubro Desktop Preload loaded successfully');
});
