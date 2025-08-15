import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

class MainProcess {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.initializeApp();
    this.setupIPC();
  }

  private initializeApp(): void {
    // Handle app ready event
    app.whenReady().then(() => {
      this.createMainWindow();

      // Handle app activation (macOS)
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    // Handle window closed events
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  private createMainWindow(): void {
    // Create the main application window
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1024,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'default',
      show: false, // Don't show until ready
    });

    // Load the renderer
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      this.mainWindow.loadFile(path.join(__dirname, 'index.html'));
      // Open DevTools in development
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupIPC(): void {
    // Handle theme change requests
    ipcMain.handle('theme:toggle', async () => {
      // This will be implemented when theme system is added
      return { success: true };
    });

    // Handle file operations
    ipcMain.handle('file:save', async (event, fileData) => {
      // This will be implemented when file system is added
      return { success: true, data: fileData };
    });

    ipcMain.handle('file:load', async (event, filePath) => {
      // This will be implemented when file system is added
      return { success: true, content: '' };
    });

    // Handle project operations
    ipcMain.handle('project:create', async (event, projectData) => {
      // This will be implemented when project management is added
      return { success: true, project: projectData };
    });

    ipcMain.handle('project:load', async (event, projectId) => {
      // This will be implemented when project management is added
      return { success: true, project: null };
    });

    // Handle LLM communication
    ipcMain.handle('llm:chat', async (event, message, context) => {
      // This will be implemented when LLM service is added
      return { success: true, response: 'Mock response' };
    });
  }
}

// Initialize the main process
new MainProcess();