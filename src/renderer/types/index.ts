// Global types for the application

export type Theme = 'dark' | 'light';

export interface LeoProject {
  id: string;
  name: string;
  description: string;
  files: LeoFile[];
  createdAt: Date;
  updatedAt: Date;
  chatHistory: ChatMessage[];
}

export interface LeoFile {
  id: string;
  name: string;
  path: string;
  content: string;
  type: 'leo' | 'md' | 'json';
  isModified: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  codeChanges?: CodeChange[];
}

export interface CodeChange {
  fileId: string;
  oldContent: string;
  newContent: string;
  description: string;
}

export interface AppState {
  currentView: 'welcome' | 'main';
  theme: Theme;
  currentProject: LeoProject | null;
  projects: LeoProject[];
}

export interface CodeAnalysis {
  issues: Array<{
    line: number;
    column?: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
    rule?: string;
  }>;
  suggestions: string[];
  complexity: number;
  maintainabilityIndex: number;
}

export interface CodeSuggestion {
  id: string;
  title: string;
  description: string;
  changes: CodeChange[];
  confidence: number;
  category: 'performance' | 'security' | 'style' | 'maintainability';
  impact: 'low' | 'medium' | 'high';
}

export interface CodeDiff {
  oldCode: string;
  newCode: string;
  fileName: string;
  lineStart: number;
  lineEnd: number;
}

export interface AnalysisResult {
  analysis: CodeAnalysis;
  suggestions: CodeSuggestion[];
  timestamp: Date;
}