export interface ElectronAPI {
  db: {
    setItem: (id: string, value: any) => Promise<boolean>;
    getItem: (id: string) => Promise<any>;
    deleteItem: (id: string) => Promise<boolean>;
    getAllItems: () => Promise<any[]>;
    ifItemExists: (id: string) => Promise<boolean>;
    renameItem: (id: string, newId: string) => Promise<boolean>;
    deleteAllItems: () => Promise<boolean>;
    setTag: (id: string, value: any) => Promise<boolean>;
    getTag: (id: string) => Promise<any>;
    deleteTag: (id: string) => Promise<boolean>;
    getAllTags: () => Promise<any[]>;
  };
  settings: {
    get: () => Promise<any>;
    set: (settings: any) => Promise<boolean>;
  };
  dialog: {
    saveFile: (content: string, defaultFilename: string) => Promise<string | null>;
    openFile: () => Promise<{ path: string; content: string } | null>;
    selectFolder: () => Promise<string | null>;
  };
  shell: {
    openExternal: (url: string) => Promise<boolean>;
    openPath: (folderPath: string) => Promise<boolean>;
  };
  clipboard: {
    writeText: (text: string) => Promise<boolean>;
    readText: () => Promise<string>;
  };
  app: {
    getDataPath: () => Promise<string>;
    getRepositoryPath: () => Promise<string>;
    setRepositoryPath: (newPath: string | null) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
