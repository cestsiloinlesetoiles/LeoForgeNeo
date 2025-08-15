import { LeoFile } from '../types';

interface CodeHistoryEntry {
  id: string;
  fileId: string;
  content: string;
  timestamp: Date;
  description: string;
  isAgentChange: boolean;
}

class CodeHistoryService {
  private static instance: CodeHistoryService;
  private history: Map<string, CodeHistoryEntry[]> = new Map();
  private currentIndex: Map<string, number> = new Map();
  private maxHistorySize = 50;

  private constructor() {}

  static getInstance(): CodeHistoryService {
    if (!CodeHistoryService.instance) {
      CodeHistoryService.instance = new CodeHistoryService();
    }
    return CodeHistoryService.instance;
  }

  private generateEntryId(): string {
    return `history_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  addEntry(file: LeoFile, description: string = 'Manual edit', isAgentChange: boolean = false): void {
    const fileHistory = this.history.get(file.id) || [];
    const currentIdx = this.currentIndex.get(file.id) || -1;

    // If we're not at the end of history, remove everything after current position
    if (currentIdx < fileHistory.length - 1) {
      fileHistory.splice(currentIdx + 1);
    }

    const entry: CodeHistoryEntry = {
      id: this.generateEntryId(),
      fileId: file.id,
      content: file.content,
      timestamp: new Date(),
      description,
      isAgentChange
    };

    fileHistory.push(entry);

    // Limit history size
    if (fileHistory.length > this.maxHistorySize) {
      fileHistory.shift();
    }

    this.history.set(file.id, fileHistory);
    this.currentIndex.set(file.id, fileHistory.length - 1);
  }

  canUndo(fileId: string): boolean {
    const currentIdx = this.currentIndex.get(fileId) || -1;
    return currentIdx > 0;
  }

  canRedo(fileId: string): boolean {
    const fileHistory = this.history.get(fileId) || [];
    const currentIdx = this.currentIndex.get(fileId) || -1;
    return currentIdx < fileHistory.length - 1;
  }

  undo(fileId: string): CodeHistoryEntry | null {
    if (!this.canUndo(fileId)) return null;

    const currentIdx = this.currentIndex.get(fileId)!;
    const newIdx = currentIdx - 1;
    this.currentIndex.set(fileId, newIdx);

    const fileHistory = this.history.get(fileId)!;
    return fileHistory[newIdx];
  }

  redo(fileId: string): CodeHistoryEntry | null {
    if (!this.canRedo(fileId)) return null;

    const currentIdx = this.currentIndex.get(fileId)!;
    const newIdx = currentIdx + 1;
    this.currentIndex.set(fileId, newIdx);

    const fileHistory = this.history.get(fileId)!;
    return fileHistory[newIdx];
  }

  getHistory(fileId: string): CodeHistoryEntry[] {
    return this.history.get(fileId) || [];
  }

  getCurrentEntry(fileId: string): CodeHistoryEntry | null {
    const fileHistory = this.history.get(fileId);
    const currentIdx = this.currentIndex.get(fileId);
    
    if (!fileHistory || currentIdx === undefined || currentIdx < 0) {
      return null;
    }

    return fileHistory[currentIdx];
  }

  getLastAgentChange(fileId: string): CodeHistoryEntry | null {
    const fileHistory = this.history.get(fileId) || [];
    
    // Find the most recent agent change
    for (let i = fileHistory.length - 1; i >= 0; i--) {
      if (fileHistory[i].isAgentChange) {
        return fileHistory[i];
      }
    }
    
    return null;
  }

  clearHistory(fileId: string): void {
    this.history.delete(fileId);
    this.currentIndex.delete(fileId);
  }

  clearAllHistory(): void {
    this.history.clear();
    this.currentIndex.clear();
  }

  getHistoryStats(fileId: string): {
    totalEntries: number;
    currentPosition: number;
    agentChanges: number;
    manualChanges: number;
  } {
    const fileHistory = this.history.get(fileId) || [];
    const currentIdx = this.currentIndex.get(fileId) || -1;
    
    const agentChanges = fileHistory.filter(entry => entry.isAgentChange).length;
    const manualChanges = fileHistory.filter(entry => !entry.isAgentChange).length;

    return {
      totalEntries: fileHistory.length,
      currentPosition: currentIdx + 1,
      agentChanges,
      manualChanges
    };
  }
}

export default CodeHistoryService.getInstance();