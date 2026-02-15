"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let mainWindow = null;
// Cache for custom repository path
let customRepositoryPath = null;
// Get the app data directory for storing settings (always use default location)
function getAppDataPath() {
    return electron_1.app.getPath('userData');
}
// Get the repository path (custom or default)
function getRepositoryPath() {
    if (customRepositoryPath) {
        return customRepositoryPath;
    }
    // Load from settings if not cached
    const settings = loadSettingsSync();
    if (settings?.repositoryPath) {
        customRepositoryPath = settings.repositoryPath;
        return customRepositoryPath;
    }
    return getAppDataPath();
}
function getScriptsPath() {
    return path.join(getRepositoryPath(), 'scripts');
}
function getTagsPath() {
    return path.join(getRepositoryPath(), 'tags');
}
function getSettingsPath() {
    // Settings are always stored in the default app data location
    return path.join(getAppDataPath(), 'settings.json');
}
// Synchronous settings loader for initialization
function loadSettingsSync() {
    const settingsPath = path.join(getAppDataPath(), 'settings.json');
    if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf-8');
        return JSON.parse(data);
    }
    return null;
}
// Ensure directories exist
function ensureDirectories() {
    const scriptsPath = getScriptsPath();
    const tagsPath = getTagsPath();
    if (!fs.existsSync(scriptsPath)) {
        fs.mkdirSync(scriptsPath, { recursive: true });
    }
    if (!fs.existsSync(tagsPath)) {
        fs.mkdirSync(tagsPath, { recursive: true });
    }
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
    }
    // Spell check context menu
    mainWindow.webContents.on('context-menu', (_event, params) => {
        const menu = new electron_1.Menu();
        // Add spelling suggestions
        if (params.misspelledWord) {
            for (const suggestion of params.dictionarySuggestions) {
                menu.append(new electron_1.MenuItem({
                    label: suggestion,
                    click: () => mainWindow.webContents.replaceMisspelling(suggestion),
                }));
            }
            if (params.dictionarySuggestions.length > 0) {
                menu.append(new electron_1.MenuItem({ type: 'separator' }));
            }
            menu.append(new electron_1.MenuItem({
                label: 'Add to Dictionary',
                click: () => mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
            }));
            menu.popup();
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// IPC Handlers for scripts
electron_1.ipcMain.handle('db:setItem', async (_event, id, value) => {
    ensureDirectories();
    const filePath = path.join(getScriptsPath(), `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ id, ...value }, null, 2));
    return true;
});
electron_1.ipcMain.handle('db:getItem', async (_event, id) => {
    const filePath = path.join(getScriptsPath(), `${id}.json`);
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    return null;
});
electron_1.ipcMain.handle('db:deleteItem', async (_event, id) => {
    const filePath = path.join(getScriptsPath(), `${id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    return true;
});
electron_1.ipcMain.handle('db:getAllItems', async () => {
    ensureDirectories();
    const scriptsPath = getScriptsPath();
    const files = fs.readdirSync(scriptsPath).filter(f => f.endsWith('.json'));
    const items = files.map(file => {
        const data = fs.readFileSync(path.join(scriptsPath, file), 'utf-8');
        return JSON.parse(data);
    });
    return items;
});
electron_1.ipcMain.handle('db:ifItemExists', async (_event, id) => {
    const filePath = path.join(getScriptsPath(), `${id}.json`);
    return fs.existsSync(filePath);
});
electron_1.ipcMain.handle('db:renameItem', async (_event, id, newId) => {
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
electron_1.ipcMain.handle('db:deleteAllItems', async () => {
    const scriptsPath = getScriptsPath();
    if (fs.existsSync(scriptsPath)) {
        const files = fs.readdirSync(scriptsPath);
        files.forEach(file => fs.unlinkSync(path.join(scriptsPath, file)));
    }
    return true;
});
// IPC Handlers for tags
electron_1.ipcMain.handle('db:setTag', async (_event, id, value) => {
    ensureDirectories();
    const filePath = path.join(getTagsPath(), `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ id, ...value }, null, 2));
    return true;
});
electron_1.ipcMain.handle('db:getTag', async (_event, id) => {
    const filePath = path.join(getTagsPath(), `${id}.json`);
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    return null;
});
electron_1.ipcMain.handle('db:deleteTag', async (_event, id) => {
    const filePath = path.join(getTagsPath(), `${id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    return true;
});
electron_1.ipcMain.handle('db:getAllTags', async () => {
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
electron_1.ipcMain.handle('settings:get', async () => {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf-8');
        return JSON.parse(data);
    }
    return null;
});
electron_1.ipcMain.handle('settings:set', async (_event, settings) => {
    const settingsPath = getSettingsPath();
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
});
// IPC Handlers for file dialogs
electron_1.ipcMain.handle('dialog:saveFile', async (_event, content, defaultFilename) => {
    const result = await electron_1.dialog.showSaveDialog(mainWindow, {
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
electron_1.ipcMain.handle('dialog:openFile', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
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
electron_1.ipcMain.handle('shell:openExternal', async (_event, url) => {
    await electron_1.shell.openExternal(url);
    return true;
});
// IPC Handlers for clipboard
electron_1.ipcMain.handle('clipboard:writeText', async (_event, text) => {
    electron_1.clipboard.writeText(text);
    return true;
});
electron_1.ipcMain.handle('clipboard:readText', async () => {
    return electron_1.clipboard.readText();
});
// Get app data path for display
electron_1.ipcMain.handle('app:getDataPath', async () => {
    return getAppDataPath();
});
// Get current repository path
electron_1.ipcMain.handle('app:getRepositoryPath', async () => {
    return getRepositoryPath();
});
// Set custom repository path
electron_1.ipcMain.handle('app:setRepositoryPath', async (_event, newPath) => {
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
electron_1.ipcMain.handle('dialog:selectFolder', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Scripts Repository Folder'
    });
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});
// Open repository folder in file explorer
electron_1.ipcMain.handle('shell:openPath', async (_event, folderPath) => {
    await electron_1.shell.openPath(folderPath);
    return true;
});
electron_1.app.whenReady().then(() => {
    ensureDirectories();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
//# sourceMappingURL=main.js.map