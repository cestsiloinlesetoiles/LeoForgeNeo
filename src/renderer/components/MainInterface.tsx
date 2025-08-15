import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import ChatPanel from './ChatPanel';
import EditorPanel from './EditorPanel';
import FileTree from './FileTree';
import ThemeToggle from './ThemeToggle';
import ProjectSwitcher from './ProjectSwitcher';
import { ChatMessage, LeoFile, LeoProject } from '../types';
import MultiProjectChatManager from '../services/MultiProjectChatManager';
import WorkflowService from '../services/WorkflowService';
import './MainInterface.css';

const MainInterface: React.FC = () => {
  const { } = useTheme();
  const { state, updateProject, switchToProject, createNewProject } = useApp();
  const [currentFile, setCurrentFile] = useState<LeoFile | null>(null);
  const [openFiles, setOpenFiles] = useState<LeoFile[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Resizable panel state
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [chatWidth, setChatWidth] = useState(400);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set the first file as current when project changes and load editor state
  useEffect(() => {
    if (state.currentProject && state.currentProject.files.length > 0) {
      // Restore editor state for this project
      const editorState = MultiProjectChatManager.getEditorState(state.currentProject.id);
      
      if (editorState && editorState.activeFileId) {
        const activeFile = state.currentProject.files.find(f => f.id === editorState.activeFileId);
        if (activeFile) {
          setCurrentFile(activeFile);
        } else {
          setCurrentFile(state.currentProject.files[0]);
        }
        
        // Restore open files
        const openFilesFromState = state.currentProject.files.filter(f => 
          editorState.openFiles.includes(f.id)
        );
        setOpenFiles(openFilesFromState);
      } else {
        setCurrentFile(state.currentProject.files[0]);
        setOpenFiles([state.currentProject.files[0]]);
        
        // Save initial editor state
        MultiProjectChatManager.saveEditorState(state.currentProject.id, {
          openFiles: [state.currentProject.files[0].id],
          activeFileId: state.currentProject.files[0].id
        });
      }
    } else {
      setCurrentFile(null);
      setOpenFiles([]);
    }
    
    // Load chat messages for current project
    const messages = MultiProjectChatManager.getActiveProjectMessages();
    setChatMessages(messages);
  }, [state.currentProject]);

  // Resize handlers
  const handleSidebarResize = useCallback((e: MouseEvent) => {
    if (!isResizingSidebar || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    const minWidth = 200;
    const maxWidth = Math.min(400, containerRect.width * 0.3);
    
    setSidebarWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
  }, [isResizingSidebar]);

  const handleChatResize = useCallback((e: MouseEvent) => {
    if (!isResizingChat || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left - sidebarWidth;
    const minWidth = 300;
    const maxWidth = Math.min(600, (containerRect.width - sidebarWidth) * 0.7);
    
    setChatWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
  }, [isResizingChat, sidebarWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizingSidebar(false);
    setIsResizingChat(false);
  }, []);

  useEffect(() => {
    if (isResizingSidebar || isResizingChat) {
      document.addEventListener('mousemove', isResizingSidebar ? handleSidebarResize : handleChatResize);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.classList.add('resizing');
      
      return () => {
        document.removeEventListener('mousemove', isResizingSidebar ? handleSidebarResize : handleChatResize);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.classList.remove('resizing');
      };
    }
  }, [isResizingSidebar, isResizingChat, handleSidebarResize, handleChatResize, handleMouseUp]);

  const handleBackToWelcome = () => {
    createNewProject();
  };

  const handleProjectSwitch = async (project: LeoProject) => {
    try {
      await WorkflowService.switchToProject(project.id);
      await switchToProject(project.id);
    } catch (error) {
      WorkflowService.handleError(error as Error, 'MainInterface.projectSwitch');
    }
  };

  const handleMessagesUpdate = async (messages: ChatMessage[]) => {
    setChatMessages(messages);
    
    if (state.currentProject) {
      try {
        // Update project chat history
        const updatedProject = {
          ...state.currentProject,
          chatHistory: messages,
          updatedAt: new Date()
        };
        
        // Use WorkflowService to save changes
        await WorkflowService.saveProjectChanges(updatedProject);
        await updateProject(updatedProject);
        
        // Add new messages to chat manager
        const currentMessages = MultiProjectChatManager.getActiveProjectMessages();
        const newMessages = messages.slice(currentMessages.length);
        
        for (const message of newMessages) {
          await MultiProjectChatManager.addMessage(message);
        }
      } catch (error) {
        WorkflowService.handleError(error as Error, 'MainInterface.messagesUpdate');
      }
    }
  };

  const handleCodeUpdate = (code: string) => {
    if (currentFile && state.currentProject) {
      const updatedFile = { ...currentFile, content: code, isModified: true };
      const updatedFiles = state.currentProject.files.map(file => 
        file.id === currentFile.id ? updatedFile : file
      );
      const updatedProject = {
        ...state.currentProject,
        files: updatedFiles,
        updatedAt: new Date()
      };
      updateProject(updatedProject);
      setCurrentFile(updatedFile);
    }
  };

  const handleFileChange = (content: string) => {
    if (currentFile && state.currentProject) {
      const updatedFile = { ...currentFile, content, isModified: true };
      const updatedFiles = state.currentProject.files.map(file => 
        file.id === currentFile.id ? updatedFile : file
      );
      const updatedProject = {
        ...state.currentProject,
        files: updatedFiles,
        updatedAt: new Date()
      };
      updateProject(updatedProject);
      setCurrentFile(updatedFile);
    }
  };

  const handleFileSave = (file: LeoFile) => {
    if (state.currentProject) {
      const updatedFiles = state.currentProject.files.map(f => 
        f.id === file.id ? file : f
      );
      const updatedProject = {
        ...state.currentProject,
        files: updatedFiles,
        updatedAt: new Date()
      };
      updateProject(updatedProject);
      setCurrentFile(file);
      
      // Update open files list
      setOpenFiles(prev => prev.map(f => f.id === file.id ? file : f));
    }
  };

  const handleFileSelect = (file: LeoFile) => {
    setCurrentFile(file);
    
    // Add to open files if not already open
    setOpenFiles(prev => {
      const newOpenFiles = prev.find(f => f.id === file.id) ? prev : [...prev, file];
      
      // Save editor state
      if (state.currentProject) {
        MultiProjectChatManager.saveEditorState(state.currentProject.id, {
          openFiles: newOpenFiles.map(f => f.id),
          activeFileId: file.id
        });
        MultiProjectChatManager.openFile(state.currentProject.id, file.id);
      }
      
      return newOpenFiles;
    });
  };

  const handleFileClose = (file: LeoFile) => {
    const newOpenFiles = openFiles.filter(f => f.id !== file.id);
    setOpenFiles(newOpenFiles);
    
    // If closing current file, switch to another open file or null
    if (currentFile?.id === file.id) {
      const newCurrentFile = newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null;
      setCurrentFile(newCurrentFile);
      
      // Save editor state
      if (state.currentProject) {
        MultiProjectChatManager.saveEditorState(state.currentProject.id, {
          openFiles: newOpenFiles.map(f => f.id),
          activeFileId: newCurrentFile?.id || null
        });
        MultiProjectChatManager.closeFile(state.currentProject.id, file.id);
      }
    }
  };

  const handleFileCreate = (name: string, type: 'leo' | 'md' | 'json') => {
    if (state.currentProject) {
      const newFile: LeoFile = {
        id: Date.now().toString(),
        name: name.includes('.') ? name : `${name}.${type}`,
        path: `/${name.includes('.') ? name : `${name}.${type}`}`,
        content: getDefaultContent(type),
        type,
        isModified: false
      };

      const updatedProject = {
        ...state.currentProject,
        files: [...state.currentProject.files, newFile],
        updatedAt: new Date()
      };
      
      updateProject(updatedProject);
      handleFileSelect(newFile);
    }
  };

  const handleFileDelete = (file: LeoFile) => {
    if (state.currentProject) {
      const updatedFiles = state.currentProject.files.filter(f => f.id !== file.id);
      const updatedProject = {
        ...state.currentProject,
        files: updatedFiles,
        updatedAt: new Date()
      };
      
      updateProject(updatedProject);
      handleFileClose(file);
    }
  };

  const getDefaultContent = (type: 'leo' | 'md' | 'json'): string => {
    switch (type) {
      case 'leo':
        return `// Leo smart contract
program hello_world.aleo {
    transition main(public a: u32, b: u32) -> u32 {
        return a + b;
    }
}`;
      case 'md':
        return `# New Document

Write your documentation here...`;
      case 'json':
        return `{
  "name": "new-config",
  "version": "1.0.0"
}`;
      default:
        return '';
    }
  };

  return (
    <div className="main-interface">
      <div className="main-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBackToWelcome}>
            + New
          </button>
          <ProjectSwitcher
            currentProject={state.currentProject}
            onProjectSwitch={handleProjectSwitch}
            onNewProject={createNewProject}
          />
        </div>
        <ThemeToggle />
      </div>

      <div className="main-content" ref={containerRef}>
        <div 
          className="sidebar-section"
          style={{ width: `${sidebarWidth}px` }}
        >
          {state.currentProject && (
            <FileTree
              project={state.currentProject}
              currentFile={currentFile}
              onFileSelect={handleFileSelect}
              onFileCreate={handleFileCreate}
              onFileDelete={handleFileDelete}
            />
          )}
        </div>

        <div 
          className="resize-handle sidebar-resize"
          onMouseDown={() => setIsResizingSidebar(true)}
        />

        <div 
          className="chat-section"
          style={{ width: `${chatWidth}px` }}
        >
          <ChatPanel
            messages={chatMessages}
            onMessagesUpdate={handleMessagesUpdate}
            onCodeUpdate={handleCodeUpdate}
            context={{
              projectId: state.currentProject?.id,
              currentFile: currentFile || undefined,
              recentMessages: chatMessages.slice(-5) || []
            }}
            placeholder="Ask me about your Leo project..."
          />
        </div>

        <div 
          className="resize-handle chat-resize"
          onMouseDown={() => setIsResizingChat(true)}
        />

        <div className="editor-section">
          <EditorPanel
            currentFile={currentFile}
            openFiles={openFiles}
            onFileChange={handleFileChange}
            onFileSave={handleFileSave}
            onFileSelect={handleFileSelect}
            onFileClose={handleFileClose}
          />
        </div>
      </div>
    </div>
  );
};

export default MainInterface;