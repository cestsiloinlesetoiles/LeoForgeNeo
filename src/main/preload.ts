import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
interface ElectronAPI {
  // Theme operations
  theme: {
    toggle: () => Promise<{ success: boolean }>;
  };

  // File operations
  file: {
    save: (fileData: any) => Promise<{ success: boolean; data: any }>;
    load: (filePath: string) => Promise<{ success: boolean; content: string }>;
  };

  // Project operations
  project: {
    create: (projectData: any) => Promise<{ success: boolean; project: any }>;
    load: (projectId: string) => Promise<{ success: boolean; project: any }>;
  };

  // LLM operations
  llm: {
    chat: (message: string, context: any) => Promise<{ success: boolean; response: string }>;
  };
}

// Expose the API to the renderer process
const electronAPI: ElectronAPI = {
  theme: {
    toggle: () => ipcRenderer.invoke('theme:toggle'),
  },

  file: {
    save: (fileData: any) => ipcRenderer.invoke('file:save', fileData),
    load: (filePath: string) => ipcRenderer.invoke('file:load', filePath),
  },

  project: {
    create: (projectData: any) => ipcRenderer.invoke('project:create', projectData),
    load: (projectId: string) => ipcRenderer.invoke('project:load', projectId),
  },

  llm: {
    chat: (message: string, context: any) => ipcRenderer.invoke('llm:chat', message, context),
  },
};

// Expose the API to the renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}