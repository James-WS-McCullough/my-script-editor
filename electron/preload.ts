import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations for scripts
  db: {
    setItem: (id: string, value: any) => ipcRenderer.invoke('db:setItem', id, value),
    getItem: (id: string) => ipcRenderer.invoke('db:getItem', id),
    deleteItem: (id: string) => ipcRenderer.invoke('db:deleteItem', id),
    getAllItems: () => ipcRenderer.invoke('db:getAllItems'),
    ifItemExists: (id: string) => ipcRenderer.invoke('db:ifItemExists', id),
    renameItem: (id: string, newId: string) => ipcRenderer.invoke('db:renameItem', id, newId),
    deleteAllItems: () => ipcRenderer.invoke('db:deleteAllItems'),
    // Tags
    setTag: (id: string, value: any) => ipcRenderer.invoke('db:setTag', id, value),
    getTag: (id: string) => ipcRenderer.invoke('db:getTag', id),
    deleteTag: (id: string) => ipcRenderer.invoke('db:deleteTag', id),
    getAllTags: () => ipcRenderer.invoke('db:getAllTags'),
  },

  // Settings (replacing localStorage)
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (settings: any) => ipcRenderer.invoke('settings:set', settings),
  },

  // File dialogs
  dialog: {
    saveFile: (content: string, defaultFilename: string) =>
      ipcRenderer.invoke('dialog:saveFile', content, defaultFilename),
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  },

  // Shell operations
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
    openPath: (folderPath: string) => ipcRenderer.invoke('shell:openPath', folderPath),
  },

  // Clipboard
  clipboard: {
    writeText: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),
    readText: () => ipcRenderer.invoke('clipboard:readText'),
  },

  // App info
  app: {
    getDataPath: () => ipcRenderer.invoke('app:getDataPath'),
    getRepositoryPath: () => ipcRenderer.invoke('app:getRepositoryPath'),
    setRepositoryPath: (newPath: string | null) => ipcRenderer.invoke('app:setRepositoryPath', newPath),
  },
});
