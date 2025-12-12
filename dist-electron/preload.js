"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Database operations for scripts
    db: {
        setItem: (id, value) => electron_1.ipcRenderer.invoke('db:setItem', id, value),
        getItem: (id) => electron_1.ipcRenderer.invoke('db:getItem', id),
        deleteItem: (id) => electron_1.ipcRenderer.invoke('db:deleteItem', id),
        getAllItems: () => electron_1.ipcRenderer.invoke('db:getAllItems'),
        ifItemExists: (id) => electron_1.ipcRenderer.invoke('db:ifItemExists', id),
        renameItem: (id, newId) => electron_1.ipcRenderer.invoke('db:renameItem', id, newId),
        deleteAllItems: () => electron_1.ipcRenderer.invoke('db:deleteAllItems'),
        // Tags
        setTag: (id, value) => electron_1.ipcRenderer.invoke('db:setTag', id, value),
        getTag: (id) => electron_1.ipcRenderer.invoke('db:getTag', id),
        deleteTag: (id) => electron_1.ipcRenderer.invoke('db:deleteTag', id),
        getAllTags: () => electron_1.ipcRenderer.invoke('db:getAllTags'),
    },
    // Settings (replacing localStorage)
    settings: {
        get: () => electron_1.ipcRenderer.invoke('settings:get'),
        set: (settings) => electron_1.ipcRenderer.invoke('settings:set', settings),
    },
    // File dialogs
    dialog: {
        saveFile: (content, defaultFilename) => electron_1.ipcRenderer.invoke('dialog:saveFile', content, defaultFilename),
        openFile: () => electron_1.ipcRenderer.invoke('dialog:openFile'),
        selectFolder: () => electron_1.ipcRenderer.invoke('dialog:selectFolder'),
    },
    // Shell operations
    shell: {
        openExternal: (url) => electron_1.ipcRenderer.invoke('shell:openExternal', url),
        openPath: (folderPath) => electron_1.ipcRenderer.invoke('shell:openPath', folderPath),
    },
    // Clipboard
    clipboard: {
        writeText: (text) => electron_1.ipcRenderer.invoke('clipboard:writeText', text),
        readText: () => electron_1.ipcRenderer.invoke('clipboard:readText'),
    },
    // App info
    app: {
        getDataPath: () => electron_1.ipcRenderer.invoke('app:getDataPath'),
        getRepositoryPath: () => electron_1.ipcRenderer.invoke('app:getRepositoryPath'),
        setRepositoryPath: (newPath) => electron_1.ipcRenderer.invoke('app:setRepositoryPath', newPath),
    },
});
//# sourceMappingURL=preload.js.map