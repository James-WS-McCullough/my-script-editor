// Check if we're running in Electron
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

// =============================================================================
// SETTINGS (replaces localStorage)
// =============================================================================

export const getSettings = async (): Promise<any> => {
  if (isElectron()) {
    return window.electronAPI.settings.get();
  }
  // Fallback to localStorage for web
  const settings = localStorage.getItem('editorSettings');
  return settings ? JSON.parse(settings) : null;
};

export const saveSettings = async (settings: any): Promise<void> => {
  if (isElectron()) {
    await window.electronAPI.settings.set(settings);
    return;
  }
  // Fallback to localStorage for web
  localStorage.setItem('editorSettings', JSON.stringify(settings));
};

// =============================================================================
// CLIPBOARD
// =============================================================================

export const copyToClipboard = async (text: string): Promise<void> => {
  if (isElectron()) {
    await window.electronAPI.clipboard.writeText(text);
    return;
  }
  // Fallback to navigator.clipboard for web
  await navigator.clipboard.writeText(text);
};

export const readFromClipboard = async (): Promise<string> => {
  if (isElectron()) {
    return window.electronAPI.clipboard.readText();
  }
  // Fallback to navigator.clipboard for web
  return navigator.clipboard.readText();
};

// =============================================================================
// FILE DIALOGS
// =============================================================================

export const saveFileDialog = async (
  content: string,
  defaultFilename: string
): Promise<string | null> => {
  if (isElectron()) {
    return window.electronAPI.dialog.saveFile(content, defaultFilename);
  }
  // Fallback to browser download for web
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  a.click();
  URL.revokeObjectURL(url);
  return defaultFilename;
};

export const openFileDialog = async (): Promise<{ path: string; content: string } | null> => {
  if (isElectron()) {
    return window.electronAPI.dialog.openFile();
  }
  // Fallback to file input for web
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            path: file.name,
            content: event.target?.result as string,
          });
        };
        reader.readAsText(file);
      } else {
        resolve(null);
      }
    };
    input.click();
  });
};

// =============================================================================
// SHELL (open external links)
// =============================================================================

export const openExternal = async (url: string): Promise<void> => {
  if (isElectron()) {
    await window.electronAPI.shell.openExternal(url);
    return;
  }
  // Fallback to window.open for web
  window.open(url, '_blank');
};

// =============================================================================
// APP INFO & REPOSITORY
// =============================================================================

export const getAppDataPath = async (): Promise<string> => {
  if (isElectron()) {
    return window.electronAPI.app.getDataPath();
  }
  return 'Browser Storage (IndexedDB)';
};

export const getRepositoryPath = async (): Promise<string> => {
  if (isElectron()) {
    return window.electronAPI.app.getRepositoryPath();
  }
  return 'Browser Storage (IndexedDB)';
};

export const setRepositoryPath = async (newPath: string | null): Promise<boolean> => {
  if (isElectron()) {
    return window.electronAPI.app.setRepositoryPath(newPath);
  }
  return false;
};

export const selectFolder = async (): Promise<string | null> => {
  if (isElectron()) {
    return window.electronAPI.dialog.selectFolder();
  }
  return null;
};

export const openRepositoryFolder = async (folderPath: string): Promise<void> => {
  if (isElectron()) {
    await window.electronAPI.shell.openPath(folderPath);
  }
};
