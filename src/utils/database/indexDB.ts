export type fileNameString = `script_${string}`;
export type tagIDString = `tag_${string}`;

// Check if we're running in Electron
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

// =============================================================================
// SCRIPT OPERATIONS
// =============================================================================

export const setItem = async (id: fileNameString, value: any): Promise<void> => {
  if (isElectron()) {
    await window.electronAPI.db.setItem(id, value);
    return;
  }
  // Fallback to IndexedDB for web
  const db = await openDB();
  const transaction = db.transaction("scripts", "readwrite");
  const store = transaction.objectStore("scripts");
  const request = store.put({ id, ...value });

  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject();
  });
};

export const getItem = async (id: fileNameString): Promise<any> => {
  if (isElectron()) {
    return window.electronAPI.db.getItem(id);
  }
  // Fallback to IndexedDB for web
  const db = await openDB();
  const transaction = db.transaction("scripts");
  const store = transaction.objectStore("scripts");
  const request = store.get(id);

  return new Promise<any>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject();
  });
};

export const deleteItem = async (id: fileNameString): Promise<void> => {
  if (isElectron()) {
    await window.electronAPI.db.deleteItem(id);
    return;
  }
  // Fallback to IndexedDB for web
  const db = await openDB();
  const transaction = db.transaction("scripts", "readwrite");
  const store = transaction.objectStore("scripts");
  const request = store.delete(id);

  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject();
  });
};

export const getAllItems = async (): Promise<any[]> => {
  if (isElectron()) {
    return window.electronAPI.db.getAllItems();
  }
  // Fallback to IndexedDB for web
  const db = await openDB();
  const transaction = db.transaction("scripts");
  const store = transaction.objectStore("scripts");
  const request = store.getAll();

  return new Promise<any[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject();
  });
};

export const ifItemExists = async (id: fileNameString): Promise<boolean> => {
  if (isElectron()) {
    return window.electronAPI.db.ifItemExists(id);
  }
  // Fallback to IndexedDB for web
  const db = await openDB();
  const transaction = db.transaction("scripts");
  const store = transaction.objectStore("scripts");
  const request = store.get(id);

  return new Promise<boolean>((resolve, reject) => {
    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => reject();
  });
};

export const renameItem = async (id: fileNameString, newID: fileNameString): Promise<void> => {
  if (isElectron()) {
    await window.electronAPI.db.renameItem(id, newID);
    return;
  }
  // Fallback to IndexedDB for web
  const db = await openDB();
  const transaction = db.transaction("scripts", "readwrite");
  const store = transaction.objectStore("scripts");
  const request = store.get(id);

  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => {
      const data = request.result;
      data.id = newID;
      store.put(data);
      store.delete(id);
      resolve();
    };
    request.onerror = () => reject();
  });
};

export const deleteAllItems = async (): Promise<void> => {
  if (isElectron()) {
    await window.electronAPI.db.deleteAllItems();
    return;
  }
  // Fallback to IndexedDB for web
  const db = await openDB();
  const transaction = db.transaction("scripts", "readwrite");
  const store = transaction.objectStore("scripts");
  const request = store.clear();

  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject();
  });
};

export const getScriptIconColor = async (id: fileNameString): Promise<string> => {
  if (isElectron()) {
    const item = await window.electronAPI.db.getItem(id);
    return item?.color || '';
  }
  // Fallback to IndexedDB for web
  const db = await openDB();
  const transaction = db.transaction("scripts");
  const store = transaction.objectStore("scripts");
  const request = store.get(id);

  return new Promise<string>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result?.color || '');
    request.onerror = () => reject();
  });
};

// =============================================================================
// TAG OPERATIONS
// =============================================================================

export const setTag = async (id: tagIDString, value: any): Promise<void> => {
  if (isElectron()) {
    await window.electronAPI.db.setTag(id, value);
    return;
  }
  // Fallback to IndexedDB for web
  const db = await openDB();
  const transaction = db.transaction("tags", "readwrite");
  const store = transaction.objectStore("tags");
  const request = store.put({ id, ...value });

  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject();
  });
};

export const getTag = async (id: tagIDString): Promise<any> => {
  if (isElectron()) {
    return window.electronAPI.db.getTag(id);
  }
  // Fallback to IndexedDB for web
  const db = await openDB();
  const transaction = db.transaction("tags");
  const store = transaction.objectStore("tags");
  const request = store.get(id);

  return new Promise<any>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject();
  });
};

export const deleteTag = async (id: tagIDString): Promise<void> => {
  if (isElectron()) {
    await window.electronAPI.db.deleteTag(id);
    return;
  }
  // Fallback to IndexedDB for web
  const db = await openDB();
  const transaction = db.transaction("tags", "readwrite");
  const store = transaction.objectStore("tags");
  const request = store.delete(id);

  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject();
  });
};

export const getAllTags = async (): Promise<any[]> => {
  if (isElectron()) {
    return window.electronAPI.db.getAllTags();
  }
  // Fallback to IndexedDB for web
  const db = await openDB();
  const transaction = db.transaction("tags");
  const store = transaction.objectStore("tags");
  const request = store.getAll();

  return new Promise<any[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject();
  });
};

// =============================================================================
// INDEXEDDB FALLBACK (for web usage)
// =============================================================================

const openDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("MyDatabase", 2);

    request.onerror = () => {
      reject("Couldn't open IndexedDB.");
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("scripts")) {
        db.createObjectStore("scripts", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("tags")) {
        db.createObjectStore("tags", { keyPath: "id" });
      }
    };
  });
};
