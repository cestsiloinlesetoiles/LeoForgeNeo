import { LeoProject, ChatMessage } from '../types';
import ProjectStorageService from './ProjectStorageService';

export interface ChatSession {
  projectId: string;
  projectName: string;
  messages: ChatMessage[];
  lastMessageAt: Date;
  isActive: boolean;
}

export interface EditorState {
  projectId: string;
  openFiles: string[]; // file IDs
  activeFileId: string | null;
  scrollPositions: Record<string, number>; // fileId -> scroll position
  cursorPositions: Record<string, { line: number; column: number }>; // fileId -> cursor position
}

class MultiProjectChatManager {
  private static instance: MultiProjectChatManager;
  private chatSessions: Map<string, ChatSession> = new Map();
  private editorStates: Map<string, EditorState> = new Map();
  private activeProjectId: string | null = null;

  private constructor() {}

  static getInstance(): MultiProjectChatManager {
    if (!MultiProjectChatManager.instance) {
      MultiProjectChatManager.instance = new MultiProjectChatManager();
    }
    return MultiProjectChatManager.instance;
  }

  /**
   * Initialize chat session for a project
   */
  async initializeProjectSession(project: LeoProject): Promise<ChatSession> {
    const existingSession = this.chatSessions.get(project.id);
    
    if (existingSession) {
      existingSession.isActive = true;
      existingSession.projectName = project.name; // Update name in case it changed
      return existingSession;
    }

    const session: ChatSession = {
      projectId: project.id,
      projectName: project.name,
      messages: [...project.chatHistory], // Copy existing chat history
      lastMessageAt: project.chatHistory.length > 0 
        ? project.chatHistory[project.chatHistory.length - 1].timestamp 
        : new Date(),
      isActive: true
    };

    this.chatSessions.set(project.id, session);
    return session;
  }

  /**
   * Switch to a different project's chat session
   */
  async switchToProject(projectId: string): Promise<ChatSession | null> {
    // Deactivate current session
    if (this.activeProjectId) {
      const currentSession = this.chatSessions.get(this.activeProjectId);
      if (currentSession) {
        currentSession.isActive = false;
        await this.saveProjectChatHistory(this.activeProjectId);
      }
    }

    // Load and activate new session
    const project = await ProjectStorageService.loadProject(projectId);
    if (!project) {
      return null;
    }

    this.activeProjectId = projectId;
    return await this.initializeProjectSession(project);
  }

  /**
   * Add a message to the current active project's chat
   */
  async addMessage(message: ChatMessage): Promise<void> {
    if (!this.activeProjectId) {
      throw new Error('No active project session');
    }

    const session = this.chatSessions.get(this.activeProjectId);
    if (!session) {
      throw new Error('Active project session not found');
    }

    session.messages.push(message);
    session.lastMessageAt = message.timestamp;

    // Auto-save chat history periodically
    await this.saveProjectChatHistory(this.activeProjectId);
  }

  /**
   * Get messages for the active project
   */
  getActiveProjectMessages(): ChatMessage[] {
    if (!this.activeProjectId) {
      return [];
    }

    const session = this.chatSessions.get(this.activeProjectId);
    return session ? session.messages : [];
  }

  /**
   * Get all chat sessions
   */
  getAllChatSessions(): ChatSession[] {
    return Array.from(this.chatSessions.values())
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  /**
   * Get active project ID
   */
  getActiveProjectId(): string | null {
    return this.activeProjectId;
  }

  /**
   * Clear chat history for a project
   */
  async clearProjectChat(projectId: string): Promise<void> {
    const session = this.chatSessions.get(projectId);
    if (session) {
      session.messages = [];
      session.lastMessageAt = new Date();
      await this.saveProjectChatHistory(projectId);
    }
  }

  /**
   * Remove a project session completely
   */
  async removeProjectSession(projectId: string): Promise<void> {
    this.chatSessions.delete(projectId);
    this.editorStates.delete(projectId);
    
    if (this.activeProjectId === projectId) {
      this.activeProjectId = null;
    }
  }

  /**
   * Save editor state for a project
   */
  saveEditorState(projectId: string, state: Partial<EditorState>): void {
    const existingState = this.editorStates.get(projectId) || {
      projectId,
      openFiles: [],
      activeFileId: null,
      scrollPositions: {},
      cursorPositions: {}
    };

    const updatedState: EditorState = {
      ...existingState,
      ...state
    };

    this.editorStates.set(projectId, updatedState);
  }

  /**
   * Get editor state for a project
   */
  getEditorState(projectId: string): EditorState | null {
    return this.editorStates.get(projectId) || null;
  }

  /**
   * Update file cursor position
   */
  updateCursorPosition(projectId: string, fileId: string, line: number, column: number): void {
    const state = this.editorStates.get(projectId);
    if (state) {
      state.cursorPositions[fileId] = { line, column };
    }
  }

  /**
   * Update file scroll position
   */
  updateScrollPosition(projectId: string, fileId: string, scrollTop: number): void {
    const state = this.editorStates.get(projectId);
    if (state) {
      state.scrollPositions[fileId] = scrollTop;
    }
  }

  /**
   * Open a file in the editor
   */
  openFile(projectId: string, fileId: string): void {
    let state = this.editorStates.get(projectId);
    if (!state) {
      state = {
        projectId,
        openFiles: [],
        activeFileId: null,
        scrollPositions: {},
        cursorPositions: {}
      };
      this.editorStates.set(projectId, state);
    }

    if (!state.openFiles.includes(fileId)) {
      state.openFiles.push(fileId);
    }
    state.activeFileId = fileId;
  }

  /**
   * Close a file in the editor
   */
  closeFile(projectId: string, fileId: string): void {
    const state = this.editorStates.get(projectId);
    if (state) {
      state.openFiles = state.openFiles.filter(id => id !== fileId);
      
      if (state.activeFileId === fileId) {
        state.activeFileId = state.openFiles.length > 0 ? state.openFiles[0] : null;
      }

      // Clean up positions for closed file
      delete state.scrollPositions[fileId];
      delete state.cursorPositions[fileId];
    }
  }

  /**
   * Create a new project session from welcome screen
   */
  async createNewProjectSession(project: LeoProject): Promise<ChatSession> {
    // If there's an active session, deactivate it
    if (this.activeProjectId) {
      const currentSession = this.chatSessions.get(this.activeProjectId);
      if (currentSession) {
        currentSession.isActive = false;
        await this.saveProjectChatHistory(this.activeProjectId);
      }
    }

    this.activeProjectId = project.id;
    return await this.initializeProjectSession(project);
  }

  /**
   * Get recent projects for quick access
   */
  getRecentProjects(limit: number = 5): ChatSession[] {
    return this.getAllChatSessions().slice(0, limit);
  }

  // Private helper methods

  private async saveProjectChatHistory(projectId: string): Promise<void> {
    try {
      const session = this.chatSessions.get(projectId);
      if (!session) return;

      const project = await ProjectStorageService.loadProject(projectId);
      if (!project) return;

      // Update project's chat history
      project.chatHistory = [...session.messages];
      project.updatedAt = new Date();

      await ProjectStorageService.saveProject(project);
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }

  /**
   * Auto-save all active sessions periodically
   */
  async autoSaveAllSessions(): Promise<void> {
    const savePromises = Array.from(this.chatSessions.keys()).map(projectId => 
      this.saveProjectChatHistory(projectId)
    );

    try {
      await Promise.all(savePromises);
    } catch (error) {
      console.error('Failed to auto-save sessions:', error);
    }
  }

  /**
   * Initialize auto-save interval
   */
  startAutoSave(intervalMs: number = 30000): void {
    setInterval(() => {
      this.autoSaveAllSessions();
    }, intervalMs);
  }
}

export default MultiProjectChatManager.getInstance();