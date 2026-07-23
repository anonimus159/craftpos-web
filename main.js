const { app, BrowserWindow, protocol, net, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { machineIdSync } = require('node-machine-id');
const Database = require('better-sqlite3');

let db;

function initDB() {
  const dbPath = path.join(app.getPath('userData'), 'craftpos.db');
  db = new Database(dbPath);

  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS store_data (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      date TEXT,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS registers (
      id TEXT PRIMARY KEY,
      date TEXT,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      data TEXT
    );
  `);
}

// IPC Handlers for DB
ipcMain.handle('db-get-all-products', () => {
  try {
    const rows = db.prepare('SELECT data FROM products').all();
    return rows.map(r => JSON.parse(r.data));
  } catch(e) { return []; }
});

ipcMain.handle('db-save-product', (event, product) => {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO products (id, data) VALUES (?, ?)');
    stmt.run(product.id, JSON.stringify(product));
    return true;
  } catch(e) { return false; }
});

ipcMain.handle('db-delete-product', (event, id) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return true;
  } catch(e) { return false; }
});

ipcMain.handle('db-save-sale', (event, sale) => {
  try {
    const stmt = db.prepare('INSERT INTO sales (id, date, data) VALUES (?, ?, ?)');
    stmt.run(sale.id, sale.date, JSON.stringify(sale));
    return true;
  } catch(e) { return false; }
});

ipcMain.handle('db-get-sales', () => {
  try {
    const rows = db.prepare('SELECT data FROM sales ORDER BY date DESC').all();
    return rows.map(r => JSON.parse(r.data));
  } catch(e) { return []; }
});

ipcMain.handle('db-save-register', (event, register) => {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO registers (id, date, data) VALUES (?, ?, ?)');
    stmt.run(register.id, register.openTime, JSON.stringify(register));
    return true;
  } catch(e) { return false; }
});

ipcMain.handle('db-get-registers', () => {
  try {
    const rows = db.prepare('SELECT data FROM registers ORDER BY date DESC').all();
    return rows.map(r => JSON.parse(r.data));
  } catch(e) { return []; }
});

// Clients
ipcMain.handle('db-get-all-clients', () => {
  try {
    const rows = db.prepare('SELECT data FROM clients').all();
    return rows.map(r => JSON.parse(r.data));
  } catch(e) { return []; }
});

ipcMain.handle('db-save-client', (event, client) => {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO clients (id, data) VALUES (?, ?)');
    stmt.run(client.id, JSON.stringify(client));
    return true;
  } catch(e) { return false; }
});

ipcMain.handle('db-delete-client', (event, id) => {
  try {
    db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    return true;
  } catch(e) { return false; }
});

// Suppliers
ipcMain.handle('db-get-all-suppliers', () => {
  try {
    const rows = db.prepare('SELECT data FROM suppliers').all();
    return rows.map(r => JSON.parse(r.data));
  } catch(e) { return []; }
});

ipcMain.handle('db-save-supplier', (event, supplier) => {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO suppliers (id, data) VALUES (?, ?)');
    stmt.run(supplier.id, JSON.stringify(supplier));
    return true;
  } catch(e) { return false; }
});

ipcMain.handle('db-delete-supplier', (event, id) => {
  try {
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    return true;
  } catch(e) { return false; }
});

// Quotes
ipcMain.handle('db-get-all-quotes', () => {
  try {
    const rows = db.prepare('SELECT data FROM quotes').all();
    return rows.map(r => JSON.parse(r.data));
  } catch(e) { return []; }
});

ipcMain.handle('db-save-quote', (event, quote) => {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO quotes (id, data) VALUES (?, ?)');
    stmt.run(quote.id, JSON.stringify(quote));
    return true;
  } catch(e) { return false; }
});

ipcMain.handle('db-delete-quote', (event, id) => {
  try {
    db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
    return true;
  } catch(e) { return false; }
});

// Purchase Orders
ipcMain.handle('db-get-all-purchase-orders', () => {
  try {
    const rows = db.prepare('SELECT data FROM purchase_orders').all();
    return rows.map(r => JSON.parse(r.data));
  } catch(e) { return []; }
});

ipcMain.handle('db-save-purchase-order', (event, order) => {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO purchase_orders (id, data) VALUES (?, ?)');
    stmt.run(order.id, JSON.stringify(order));
    return true;
  } catch(e) { return false; }
});

ipcMain.handle('db-delete-purchase-order', (event, id) => {
  try {
    db.prepare('DELETE FROM purchase_orders WHERE id = ?').run(id);
    return true;
  } catch(e) { return false; }
});

ipcMain.handle('get-printers', async (event) => {
  try {
    return await event.sender.getPrintersAsync();
  } catch (e) {
    console.error('Failed to get printers', e);
    return [];
  }
});

ipcMain.handle('print-ticket', async (event, htmlContent, printerName) => {
  return new Promise((resolve) => {
    let printWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
    printWin.loadURL(dataUrl);

    printWin.webContents.on('did-finish-load', () => {
      printWin.webContents.print({
        silent: true,
        deviceName: printerName,
        margins: { marginType: 'none' }
      }, (success, errorType) => {
        printWin.close();
        resolve(success);
      });
    });
  });
});

ipcMain.handle('get-machine-id', () => {
  try {
    return machineIdSync();
  } catch (e) {
    return 'UNKNOWN-MACHINE-ID';
  }
});

// DB Backup
ipcMain.handle('db-backup', async () => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Respaldar Base de Datos',
    defaultPath: `craftpos_backup_${new Date().toISOString().split('T')[0]}.db`,
    filters: [{ name: 'Base de Datos SQLite', extensions: ['db'] }]
  });

  if (filePath) {
    try {
      if (db) db.close(); // Flush WAL to main DB file before copying
      const dbPath = path.join(app.getPath('userData'), 'craftpos.db');
      fs.copyFileSync(dbPath, filePath);
      
      // Re-open DB
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      
      return { success: true, path: filePath };
    } catch (e) {
      // Ensure we reopen if it fails
      const dbPath = path.join(app.getPath('userData'), 'craftpos.db');
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      return { success: false, error: e.message };
    }
  }
  return { success: false, canceled: true };
});

// DB Restore
ipcMain.handle('db-restore', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Restaurar Base de Datos',
    properties: ['openFile'],
    filters: [{ name: 'Base de Datos SQLite', extensions: ['db'] }]
  });

  if (filePaths && filePaths.length > 0) {
    try {
      if (db) db.close(); // Close DB connection so we can overwrite the file
      const dbPath = path.join(app.getPath('userData'), 'craftpos.db');
      
      // Delete WAL and SHM files to prevent corruption after replacing main DB
      try { fs.unlinkSync(dbPath + '-wal'); } catch (e) {}
      try { fs.unlinkSync(dbPath + '-shm'); } catch (e) {}

      fs.copyFileSync(filePaths[0], dbPath);

      // Relaunch the app automatically
      app.relaunch();
      app.exit();
      return { success: true };
    } catch (e) {
      // If error, try reopening
      const dbPath = path.join(app.getPath('userData'), 'craftpos.db');
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      return { success: false, error: e.message };
    }
  }
  return { success: false, canceled: true };
});

// Register 'app' scheme before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true, corsEnabled: true } }
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    },
    title: 'CraftPOS - Sistema de Punto de Venta',
    icon: path.join(__dirname, 'public', 'craftpos_icon.png'),
    autoHideMenuBar: true,
    backgroundColor: '#FAF6EE',
    show: false,
  });

  // Show window when ready to avoid white flash
  win.once('ready-to-show', () => {
    win.show();
    win.maximize();
  });

  // Allow downloads to show the "Save As" dialog so the user knows they are exporting
  win.webContents.session.on('will-download', (event, item, webContents) => {
    // We intentionally do not use setSavePath so the native Save dialog appears.
    // If you want it silent again, uncomment below:
    // const defaultPath = path.join(app.getPath('downloads'), item.getFilename());
    // item.setSavePath(defaultPath);
  });

  // Load the app
  win.loadURL('app://./index.html');
}

app.whenReady().then(() => {
  initDB();

  // Serve static Next.js export via custom 'app://' protocol
  protocol.handle('app', async (request) => {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);

    // Resolve to out directory
    let filePath = path.join(__dirname, 'out', pathname);

    // If directory or no extension, serve index.html
    if (pathname === '/' || pathname === '' || !path.extname(pathname)) {
      filePath = path.join(__dirname, 'out', pathname, 'index.html');
    }

    // Fallback if file doesn't exist
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, 'out', 'index.html');
    }

    return net.fetch('file://' + filePath);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
