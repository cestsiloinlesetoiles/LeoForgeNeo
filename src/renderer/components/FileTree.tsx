import React, { useState } from 'react';
import { LeoFile, LeoProject } from '../types';
import { useApp } from '../contexts/AppContext';
import './FileTree.css';

interface FileTreeProps {
  project: LeoProject;
  currentFile: LeoFile | null;
  onFileSelect: (file: LeoFile) => void;
  onFileCreate: (name: string, type: 'leo' | 'md' | 'json') => void;
  onFileDelete: (file: LeoFile) => void;
}

interface ProjectSelectorProps {
  currentProject: LeoProject | null;
  projects: LeoProject[];
  onProjectSelect: (project: LeoProject) => void;
  onNewProject: () => void;
}

interface FileTreeItemProps {
  file: LeoFile;
  isSelected: boolean;
  onSelect: (file: LeoFile) => void;
  onDelete: (file: LeoFile) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  currentProject,
  projects,
  onProjectSelect,
  onNewProject
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="project-selector">
      <div className="project-selector-header">
        <button 
          className="project-dropdown-trigger"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <span className="project-icon">📁</span>
          <span className="project-name">
            {currentProject?.name || 'No Project'}
          </span>
          <span className="dropdown-arrow">{showDropdown ? '▲' : '▼'}</span>
        </button>
        <button 
          className="new-project-button"
          onClick={onNewProject}
          title="Create new project"
        >
          +
        </button>
      </div>

      {showDropdown && (
        <>
          <div 
            className="dropdown-overlay" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="project-dropdown">
            {projects.length === 0 ? (
              <div className="no-projects">
                <p>No projects available</p>
                <button 
                  className="create-first-project"
                  onClick={() => {
                    onNewProject();
                    setShowDropdown(false);
                  }}
                >
                  Create your first project
                </button>
              </div>
            ) : (
              <div className="project-list">
                {projects.map(project => (
                  <button
                    key={project.id}
                    className={`project-item ${currentProject?.id === project.id ? 'active' : ''}`}
                    onClick={() => {
                      onProjectSelect(project);
                      setShowDropdown(false);
                    }}
                  >
                    <span className="project-icon">📁</span>
                    <div className="project-info">
                      <span className="project-name">{project.name}</span>
                      <span className="project-files-count">
                        {project.files.length} files
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  file,
  isSelected,
  onSelect,
  onDelete
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'leo':
        return '🦁';
      case 'md':
        return '📝';
      case 'json':
        return '⚙️';
      default:
        return '📄';
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu(true);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
      onDelete(file);
    }
    setShowContextMenu(false);
  };

  const handleRename = () => {
    setIsRenaming(true);
    setShowContextMenu(false);
  };

  const handleRenameSubmit = () => {
    if (newName.trim() && newName !== file.name) {
      // TODO: Implement rename functionality
      console.log(`Rename ${file.name} to ${newName}`);
    }
    setIsRenaming(false);
    setNewName(file.name);
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setNewName(file.name);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const handleDuplicate = () => {
    // TODO: Implement duplicate functionality
    console.log(`Duplicate ${file.name}`);
    setShowContextMenu(false);
  };

  return (
    <div className="file-tree-item-container">
      <div
        className={`file-tree-item ${isSelected ? 'selected' : ''} ${file.isModified ? 'modified' : ''}`}
        onClick={() => !isRenaming && onSelect(file)}
        onContextMenu={handleContextMenu}
      >
        <span className="file-icon">{getFileIcon(file.type)}</span>
        {isRenaming ? (
          <input
            className="file-rename-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleRenameSubmit}
            autoFocus
          />
        ) : (
          <span className="file-name">{file.name}</span>
        )}
        {file.isModified && <span className="modified-dot">●</span>}
      </div>
      
      {showContextMenu && (
        <>
          <div 
            className="context-menu-overlay" 
            onClick={() => setShowContextMenu(false)}
          />
          <div className="context-menu">
            <button 
              className="context-menu-item"
              onClick={handleRename}
            >
              Rename
            </button>
            <button 
              className="context-menu-item"
              onClick={handleDuplicate}
            >
              Duplicate
            </button>
            <div className="context-menu-separator" />
            <button 
              className="context-menu-item danger"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({
  project,
  currentFile,
  onFileSelect,
  onFileCreate,
  onFileDelete
}) => {
  const { state, setCurrentProject, setView } = useApp();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'leo' | 'md' | 'json'>('leo');

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim(), newFileType);
      setNewFileName('');
      setShowCreateDialog(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateFile();
    } else if (e.key === 'Escape') {
      setShowCreateDialog(false);
      setNewFileName('');
    }
  };

  const handleProjectSelect = (selectedProject: LeoProject) => {
    setCurrentProject(selectedProject);
  };

  const handleNewProject = () => {
    setView('welcome');
  };

  return (
    <div className="file-tree">
      <ProjectSelector
        currentProject={state.currentProject}
        projects={state.projects}
        onProjectSelect={handleProjectSelect}
        onNewProject={handleNewProject}
      />
      
      <div className="file-tree-header">
        <h3>Files</h3>
        <button 
          className="create-file-button"
          onClick={() => setShowCreateDialog(true)}
          title="Create new file"
        >
          +
        </button>
      </div>

      <div className="file-tree-content">
        {project.files.length === 0 ? (
          <div className="no-files">
            <p>No files in project</p>
            <button 
              className="create-first-file"
              onClick={() => setShowCreateDialog(true)}
            >
              Create your first file
            </button>
          </div>
        ) : (
          <div className="file-list">
            {project.files.map(file => (
              <FileTreeItem
                key={file.id}
                file={file}
                isSelected={currentFile?.id === file.id}
                onSelect={onFileSelect}
                onDelete={onFileDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateDialog && (
        <>
          <div 
            className="dialog-overlay" 
            onClick={() => setShowCreateDialog(false)}
          />
          <div className="create-file-dialog">
            <h4>Create New File</h4>
            <div className="form-group">
              <label htmlFor="fileName">File Name:</label>
              <input
                id="fileName"
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter file name..."
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="fileType">File Type:</label>
              <select
                id="fileType"
                value={newFileType}
                onChange={(e) => setNewFileType(e.target.value as 'leo' | 'md' | 'json')}
              >
                <option value="leo">Leo Smart Contract (.leo)</option>
                <option value="md">Markdown (.md)</option>
                <option value="json">JSON Configuration (.json)</option>
              </select>
            </div>
            <div className="dialog-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="create-button"
                onClick={handleCreateFile}
                disabled={!newFileName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FileTree;