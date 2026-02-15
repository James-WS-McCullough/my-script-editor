import { app, BrowserWindow, ipcMain, dialog, shell, clipboard, Menu, MenuItem } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

// Cache for custom repository path
let customRepositoryPath: string | null = null;

// Get the app data directory for storing settings (always use default location)
function getAppDataPath(): string {
  return app.getPath('userData');
}

// Get the repository path (custom or default)
function getRepositoryPath(): string {
  if (customRepositoryPath) {
    return customRepositoryPath;
  }
  // Load from settings if not cached
  const settings = loadSettingsSync();
  if (settings?.repositoryPath) {
    customRepositoryPath = settings.repositoryPath as string;
    return customRepositoryPath;
  }
  return getAppDataPath();
}

function getScriptsPath(): string {
  return path.join(getRepositoryPath(), 'scripts');
}

function getTagsPath(): string {
  return path.join(getRepositoryPath(), 'tags');
}

function getSettingsPath(): string {
  // Settings are always stored in the default app data location
  return path.join(getAppDataPath(), 'settings.json');
}

// Synchronous settings loader for initialization
function loadSettingsSync(): any {
  const settingsPath = path.join(getAppDataPath(), 'settings.json');
  if (fs.existsSync(settingsPath)) {
    const data = fs.readFileSync(settingsPath, 'utf-8');
    return JSON.parse(data);
  }
  return null;
}

// Ensure directories exist
function ensureDirectories(): void {
  const scriptsPath = getScriptsPath();
  const tagsPath = getTagsPath();

  if (!fs.existsSync(scriptsPath)) {
    fs.mkdirSync(scriptsPath, { recursive: true });
  }
  if (!fs.existsSync(tagsPath)) {
    fs.mkdirSync(tagsPath, { recursive: true });
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
  });

  // In development, load from localhost
  // In production, load the built files
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // Spell check context menu
  mainWindow.webContents.on('context-menu', (_event, params) => {
    const menu = new Menu();

    // Add spelling suggestions
    if (params.misspelledWord) {
      for (const suggestion of params.dictionarySuggestions) {
        menu.append(new MenuItem({
          label: suggestion,
          click: () => mainWindow!.webContents.replaceMisspelling(suggestion),
        }));
      }
      if (params.dictionarySuggestions.length > 0) {
        menu.append(new MenuItem({ type: 'separator' }));
      }
      menu.append(new MenuItem({
        label: 'Add to Dictionary',
        click: () => mainWindow!.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
      }));
      menu.popup();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for scripts
ipcMain.handle('db:setItem', async (_event, id: string, value: any) => {
  ensureDirectories();
  const filePath = path.join(getScriptsPath(), `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify({ id, ...value }, null, 2));
  return true;
});

ipcMain.handle('db:getItem', async (_event, id: string) => {
  const filePath = path.join(getScriptsPath(), `${id}.json`);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }
  return null;
});

ipcMain.handle('db:deleteItem', async (_event, id: string) => {
  const filePath = path.join(getScriptsPath(), `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  return true;
});

ipcMain.handle('db:getAllItems', async () => {
  ensureDirectories();
  const scriptsPath = getScriptsPath();
  const files = fs.readdirSync(scriptsPath).filter(f => f.endsWith('.json'));
  const items = files.map(file => {
    const data = fs.readFileSync(path.join(scriptsPath, file), 'utf-8');
    return JSON.parse(data);
  });
  return items;
});

ipcMain.handle('db:ifItemExists', async (_event, id: string) => {
  const filePath = path.join(getScriptsPath(), `${id}.json`);
  return fs.existsSync(filePath);
});

ipcMain.handle('db:renameItem', async (_event, id: string, newId: string) => {
  const oldPath = path.join(getScriptsPath(), `${id}.json`);
  const newPath = path.join(getScriptsPath(), `${newId}.json`);
  if (fs.existsSync(oldPath)) {
    const data = JSON.parse(fs.readFileSync(oldPath, 'utf-8'));
    data.id = newId;
    fs.writeFileSync(newPath, JSON.stringify(data, null, 2));
    fs.unlinkSync(oldPath);
  }
  return true;
});

ipcMain.handle('db:deleteAllItems', async () => {
  const scriptsPath = getScriptsPath();
  if (fs.existsSync(scriptsPath)) {
    const files = fs.readdirSync(scriptsPath);
    files.forEach(file => fs.unlinkSync(path.join(scriptsPath, file)));
  }
  return true;
});

// IPC Handlers for tags
ipcMain.handle('db:setTag', async (_event, id: string, value: any) => {
  ensureDirectories();
  const filePath = path.join(getTagsPath(), `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify({ id, ...value }, null, 2));
  return true;
});

ipcMain.handle('db:getTag', async (_event, id: string) => {
  const filePath = path.join(getTagsPath(), `${id}.json`);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }
  return null;
});

ipcMain.handle('db:deleteTag', async (_event, id: string) => {
  const filePath = path.join(getTagsPath(), `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  return true;
});

ipcMain.handle('db:getAllTags', async () => {
  ensureDirectories();
  const tagsPath = getTagsPath();
  const files = fs.readdirSync(tagsPath).filter(f => f.endsWith('.json'));
  const items = files.map(file => {
    const data = fs.readFileSync(path.join(tagsPath, file), 'utf-8');
    return JSON.parse(data);
  });
  return items;
});

// IPC Handlers for settings (replacing localStorage)
ipcMain.handle('settings:get', async () => {
  const settingsPath = getSettingsPath();
  if (fs.existsSync(settingsPath)) {
    const data = fs.readFileSync(settingsPath, 'utf-8');
    return JSON.parse(data);
  }
  return null;
});

ipcMain.handle('settings:set', async (_event, settings: any) => {
  const settingsPath = getSettingsPath();
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  return true;
});

// IPC Handlers for file dialogs
ipcMain.handle('dialog:saveFile', async (_event, content: string, defaultFilename: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultFilename,
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content);
    return result.filePath;
  }
  return null;
});

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    return { path: result.filePaths[0], content };
  }
  return null;
});

// IPC Handlers for shell operations
ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  await shell.openExternal(url);
  return true;
});

// IPC Handlers for clipboard
ipcMain.handle('clipboard:writeText', async (_event, text: string) => {
  clipboard.writeText(text);
  return true;
});

ipcMain.handle('clipboard:readText', async () => {
  return clipboard.readText();
});

// Get app data path for display
ipcMain.handle('app:getDataPath', async () => {
  return getAppDataPath();
});

// Get current repository path
ipcMain.handle('app:getRepositoryPath', async () => {
  return getRepositoryPath();
});

// Set custom repository path
ipcMain.handle('app:setRepositoryPath', async (_event, newPath: string | null) => {
  customRepositoryPath = newPath;
  // Update settings
  const settings = loadSettingsSync() || {};
  settings.repositoryPath = newPath;
  const settingsPath = getSettingsPath();
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  // Ensure new directories exist
  ensureDirectories();
  return true;
});

// Open folder dialog for selecting repository
ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Scripts Repository Folder'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Open repository folder in file explorer
ipcMain.handle('shell:openPath', async (_event, folderPath: string) => {
  await shell.openPath(folderPath);
  return true;
});

app.whenReady().then(() => {
  ensureDirectories();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
