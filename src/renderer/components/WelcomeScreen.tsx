import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { LeoProject, ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';
import ThemeToggle from './ThemeToggle';
import ProjectManager from './ProjectManager';
import WorkflowService from '../services/WorkflowService';

import './WelcomeScreen.css';

const WelcomeScreen: React.FC = () => {
  const { } = useTheme();
  const { state, setView, addProject, switchToProject, loadProjects } = useApp();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([
    {
      id: '1',
      content: 'Describe your projet',
      sender: 'agent',
      timestamp: new Date()
    }
  ]);

  useEffect(() => {
    // Load projects when component mounts
    loadProjects();
  }, [loadProjects]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage('');
    setIsLoading(true);

    try {
      // Use WorkflowService for complete project creation workflow
      const { project, messages } = await WorkflowService.createProjectFromDescription(currentMessage);
      
      // Update chat messages with the complete conversation
      setChatMessages(messages);
      setIsLoading(false);

      // Add project and switch to main view
      setTimeout(() => {
        addProject(project).then(() => {
          setView('main');
        }).catch((error) => {
          WorkflowService.handleError(error, 'WelcomeScreen.addProject');
          const errorResponse: ChatMessageType = {
            id: (Date.now() + 2).toString(),
            content: 'Failed to save the project. Please try again.',
            sender: 'agent',
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, errorResponse]);
          setIsLoading(false);
        });
      }, 1000);
    } catch (error) {
      WorkflowService.handleError(error as Error, 'WelcomeScreen.generateProject');
      
      const errorResponse: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while generating your project. Please try again.',
        sender: 'agent',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorResponse]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleProjectSelect = async (project: LeoProject) => {
    try {
      await WorkflowService.switchToProject(project.id);
      await switchToProject(project.id);
    } catch (error) {
      WorkflowService.handleError(error as Error, 'WelcomeScreen.projectSelect');
      // Show error message to user
      const errorResponse: ChatMessageType = {
        id: Date.now().toString(),
        content: 'Failed to load the selected project. Please try again.',
        sender: 'agent',
        timestamp: new Date()
      };
      setChatMessages([errorResponse]);
    }
  };

  const handleProjectDelete = async () => {
    await loadProjects(); // Refresh the project list
  };

  const handleCreateNewProject = () => {
    setShowProjectManager(false);
    // Reset chat to initial state for new project creation
    setChatMessages([
      {
        id: '1',
        content: 'Describe your projet',
        sender: 'agent',
        timestamp: new Date()
      }
    ]);
    setMessage('');
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-header">
        <h1 className="welcome-title">LeoForge Neo</h1>
        <div className="header-actions">
          {state.projects.length > 0 && (
            <button 
              className="btn-manage-projects"
              onClick={() => setShowProjectManager(!showProjectManager)}
            >
              {showProjectManager ? 'New Project' : 'My Projects'}
            </button>
          )}
          <ThemeToggle size="lg" />
        </div>
      </div>

      <div className="welcome-content">
        {showProjectManager ? (
          <div className="project-manager-section">
            <ProjectManager
              currentProject={state.currentProject}
              onProjectSelect={handleProjectSelect}
              onProjectCreate={handleCreateNewProject}
              onProjectDelete={handleProjectDelete}
              className="welcome-project-manager"
            />
          </div>
        ) : (
          <div className="chat-container">
            <div className="chat-messages">
              {chatMessages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <ChatMessage 
                  message={{
                    id: 'typing',
                    content: '',
                    sender: 'agent',
                    timestamp: new Date()
                  }}
                  isTyping={true}
                />
              )}
            </div>

            <div className="chat-input-container">
              <textarea
                className="chat-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your Leo project..."
                rows={3}
                disabled={isLoading}
              />
              <button 
                className="send-button"
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
              >
                {isLoading ? '⏳' : '➤'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;