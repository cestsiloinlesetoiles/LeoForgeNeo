import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../contexts/ThemeContext';
import { LeoFile } from '../types';
import FileTabs from './FileTabs';
import CodeHistoryService from '../services/CodeHistoryService';
import './EditorPanel.css';

interface EditorPanelProps {
  currentFile: LeoFile | null;
  openFiles: LeoFile[];
  onFileChange: (content: string) => void;
  onFileSave: (file: LeoFile) => void;
  onFileSelect: (file: LeoFile) => void;
  onFileClose: (file: LeoFile) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  currentFile,
  openFiles,
  onFileChange,
  onFileSave,
  onFileSelect,
  onFileClose
}) => {
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState<string>('');

  // Handle editor mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // Configure Leo language syntax highlighting
    configureLeoLanguage(monaco);

    // Set up keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (currentFile) {
        const content = editor.getValue();
        const updatedFile = { ...currentFile, content, isModified: false };
        onFileSave(updatedFile);
      }
    });

    // Auto-save on content change (debounced)
    let saveTimeout: NodeJS.Timeout;
    editor.onDidChangeModelContent(() => {
      const content = editor.getValue();
      onFileChange(content);
      
      // Add to history if content has changed significantly
      if (currentFile && content !== lastSavedContent) {
        // Only add to history if the change is substantial (more than just whitespace)
        const trimmedOld = lastSavedContent.trim();
        const trimmedNew = content.trim();
        if (trimmedOld !== trimmedNew) {
          CodeHistoryService.addEntry(
            { ...currentFile, content: lastSavedContent }, 
            'Manual edit', 
            false
          );
          setLastSavedContent(content);
        }
      }
      
      // Debounced auto-save after 2 seconds of inactivity
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        if (currentFile) {
          const updatedFile = { ...currentFile, content, isModified: false };
          onFileSave(updatedFile);
        }
      }, 2000);
    });
  };

  // Configure Leo language syntax highlighting
  const configureLeoLanguage = (monaco: any) => {
    // Register Leo language
    monaco.languages.register({ id: 'leo' });

    // Define Leo language tokens
    monaco.languages.setMonarchTokensProvider('leo', {
      tokenizer: {
        root: [
          // Keywords
          [/\b(program|function|struct|record|mapping|transition|finalize|import|as|public|private|const|let|if|else|for|in|return|assert|assert_eq|assert_neq)\b/, 'keyword'],
          
          // Types
          [/\b(u8|u16|u32|u64|u128|i8|i16|i32|i64|i128|field|group|scalar|bool|address|signature)\b/, 'type'],
          
          // Numbers
          [/\b\d+(_\d+)*[ui]?(8|16|32|64|128)?\b/, 'number'],
          [/\b0x[0-9a-fA-F]+(_[0-9a-fA-F]+)*[ui]?(8|16|32|64|128)?\b/, 'number'],
          
          // Strings
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string'],
          
          // Comments
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          
          // Identifiers
          [/[a-zA-Z_]\w*/, 'identifier'],
          
          // Operators
          [/[+\-*/%=!<>&|^~]/, 'operator'],
          
          // Delimiters
          [/[{}()\[\]]/, 'delimiter'],
          [/[;,.]/, 'delimiter'],
        ],
        
        string: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop']
        ],
        
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ]
      }
    });

    // Define Leo language configuration
    monaco.languages.setLanguageConfiguration('leo', {
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' }
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' }
      ]
    });
  };

  // Get Monaco theme based on current theme
  const getMonacoTheme = () => {
    return theme === 'dark' ? 'vs-dark' : 'vs-light';
  };

  // Update last saved content when file changes
  useEffect(() => {
    if (currentFile) {
      setLastSavedContent(currentFile.content);
    }
  }, [currentFile?.id]);

  // Editor options
  const editorOptions = {
    minimap: { enabled: true },
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
    lineNumbers: 'on' as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 4,
    insertSpaces: true,
    wordWrap: 'on' as const,
    renderWhitespace: 'selection' as const,
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true
    }
  };

  return (
    <div className="editor-panel">
      <FileTabs
        openFiles={openFiles}
        currentFile={currentFile}
        onFileSelect={onFileSelect}
        onFileClose={onFileClose}
      />
      <div className="panel-header">
        <div className="header-left">
          <h3>Editor</h3>
          {currentFile && (
            <div className="file-info">
              <span className="file-name">{currentFile.name}</span>
              {currentFile.isModified && <span className="modified-indicator">●</span>}
            </div>
          )}
        </div>
        <div className="header-right">
          {currentFile && (
            <button 
              className="save-button"
              onClick={() => {
                if (editorRef.current && currentFile) {
                  const content = editorRef.current.getValue();
                  const updatedFile = { ...currentFile, content, isModified: false };
                  onFileSave(updatedFile);
                }
              }}
              disabled={!currentFile.isModified}
            >
              Save (Ctrl+S)
            </button>
          )}
        </div>
      </div>

      <div className="editor-container">
        {currentFile ? (
          <Editor
            height="100%"
            language={currentFile.type === 'leo' ? 'leo' : currentFile.type}
            value={currentFile.content}
            theme={getMonacoTheme()}
            options={editorOptions}
            onMount={handleEditorDidMount}
            loading={<div className="editor-loading">Loading editor...</div>}
          />
        ) : (
          <div className="no-file-selected">
            <div className="no-file-content">
              <h3>No file selected</h3>
              <p>Select a file from the project to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPanel;