import React, { useState, useEffect, useRef } from 'react';
import { LeoProject } from '../types';
import MultiProjectChatManager, { ChatSession } from '../services/MultiProjectChatManager';
import './ProjectSwitcher.css';

interface ProjectSwitcherProps {
  currentProject: LeoProject | null;
  onProjectSwitch: (project: LeoProject) => void;
  onNewProject: () => void;
  className?: string;
}

const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({
  currentProject,
  onProjectSwitch,
  onNewProject,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, [currentProject]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSessions = () => {
    const allSessions = MultiProjectChatManager.getAllChatSessions();
    setSessions(allSessions);
  };

  const handleProjectSelect = async (session: ChatSession) => {
    try {
      const switchedSession = await MultiProjectChatManager.switchToProject(session.projectId);
      if (switchedSession) {
        // We need to load the full project to pass to the parent
        const ProjectStorageService = (await import('../services/ProjectStorageService')).default;
        const project = await ProjectStorageService.loadProject(session.projectId);
        if (project) {
          onProjectSwitch(project);
        }
      }
    } catch (error) {
      console.error('Failed to switch project:', error);
    }
    setIsOpen(false);
  };

  const formatLastMessage = (session: ChatSession): string => {
    const now = new Date();
    const diffMs = now.getTime() - session.lastMessageAt.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return session.lastMessageAt.toLocaleDateString();
  };

  const getMessageCount = (session: ChatSession): number => {
    return session.messages.length;
  };

  return (
    <div className={`project-switcher ${className}`} ref={dropdownRef}>
      <button
        className="project-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Switch Project"
      >
        <div className="current-project-info">
          <span className="project-icon">📁</span>
          <div className="project-details">
            <span className="project-name">
              {currentProject ? currentProject.name : 'No Project'}
            </span>
            {currentProject && (
              <span className="project-files">
                {currentProject.files.length} files
              </span>
            )}
          </div>
        </div>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="project-switcher-dropdown">
          <div className="dropdown-header">
            <span>Recent Projects</span>
            <button
              className="btn-new-project-small"
              onClick={() => {
                onNewProject();
                setIsOpen(false);
              }}
              title="New Project"
            >
              +
            </button>
          </div>

          <div className="project-list">
            {sessions.length === 0 ? (
              <div className="empty-projects">
                <span>No recent projects</span>
                <button
                  className="btn-create-first-small"
                  onClick={() => {
                    onNewProject();
                    setIsOpen(false);
                  }}
                >
                  Create your first project
                </button>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.projectId}
                  className={`project-option ${
                    currentProject?.id === session.projectId ? 'active' : ''
                  }`}
                  onClick={() => handleProjectSelect(session)}
                >
                  <div className="project-option-info">
                    <div className="project-option-name">{session.projectName}</div>
                    <div className="project-option-meta">
                      <span className="message-count">
                        {getMessageCount(session)} messages
                      </span>
                      <span className="last-activity">
                        {formatLastMessage(session)}
                      </span>
                    </div>
                  </div>
                  {session.isActive && (
                    <div className="active-indicator" title="Currently Active">
                      ●
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="dropdown-footer">
            <button
              className="btn-manage-projects"
              onClick={() => {
                // This could open a project management modal
                setIsOpen(false);
              }}
            >
              Manage Projects
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSwitcher;