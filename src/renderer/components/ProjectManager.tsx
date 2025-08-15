import React, { useState, useEffect } from 'react';
import { LeoProject } from '../types';
import ProjectStorageService, { ProjectMetadata } from '../services/ProjectStorageService';
import ConfirmationDialog from './ConfirmationDialog';
import './ProjectManager.css';

interface ProjectManagerProps {
  currentProject: LeoProject | null;
  onProjectSelect: (project: LeoProject) => void;
  onProjectCreate: () => void;
  onProjectDelete?: (projectId: string) => void;
  className?: string;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  currentProject,
  onProjectSelect,
  onProjectCreate,
  onProjectDelete,
  className = ''
}) => {
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    project: ProjectMetadata | null;
  }>({ show: false, project: null });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsMetadata = await ProjectStorageService.getAllProjectsMetadata();
      setProjects(projectsMetadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = async (metadata: ProjectMetadata) => {
    try {
      const project = await ProjectStorageService.loadProject(metadata.id);
      if (project) {
        onProjectSelect(project);
        // Refresh the list to update last accessed time
        await loadProjects();
      } else {
        setError('Project not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
      console.error('Failed to load project:', err);
    }
  };

  const handleDeleteClick = (project: ProjectMetadata, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent project selection
    setDeleteConfirm({ show: true, project });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.project) return;

    try {
      const success = await ProjectStorageService.deleteProject(deleteConfirm.project.id);
      if (success) {
        await loadProjects();
        onProjectDelete?.(deleteConfirm.project.id);
        
        // If we deleted the current project, clear it
        if (currentProject?.id === deleteConfirm.project.id) {
          // The parent component should handle clearing the current project
        }
      } else {
        setError('Failed to delete project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      console.error('Failed to delete project:', err);
    } finally {
      setDeleteConfirm({ show: false, project: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, project: null });
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className={`project-manager ${className}`}>
        <div className="project-manager-header">
          <h3>Projects</h3>
          <button 
            className="btn-new-project"
            onClick={onProjectCreate}
            title="Create New Project"
          >
            +
          </button>
        </div>
        <div className="project-manager-loading">
          <div className="loading-spinner"></div>
          <span>Loading projects...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`project-manager ${className}`}>
        <div className="project-manager-header">
          <h3>Projects</h3>
          <button 
            className="btn-new-project"
            onClick={onProjectCreate}
            title="Create New Project"
          >
            +
          </button>
        </div>
        <div className="project-manager-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button className="btn-retry" onClick={loadProjects}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`project-manager ${className}`}>
      <div className="project-manager-header">
        <h3>Projects</h3>
        <button 
          className="btn-new-project"
          onClick={onProjectCreate}
          title="Create New Project"
        >
          +
        </button>
      </div>

      <div className="project-list">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <p>No projects yet</p>
            <button className="btn-create-first" onClick={onProjectCreate}>
              Create your first project
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className={`project-item ${currentProject?.id === project.id ? 'active' : ''}`}
              onClick={() => handleProjectClick(project)}
            >
              <div className="project-info">
                <div className="project-name">{project.name}</div>
                <div className="project-description">{project.description}</div>
                <div className="project-meta">
                  <span className="project-files">{project.fileCount} files</span>
                  <span className="project-size">{formatSize(project.size)}</span>
                  <span className="project-date">{formatDate(project.lastAccessedAt)}</span>
                </div>
              </div>
              <div className="project-actions">
                <button
                  className="btn-delete"
                  onClick={(e) => handleDeleteClick(project, e)}
                  title="Delete Project"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteConfirm.show && deleteConfirm.project && (
        <ConfirmationDialog
          title="Delete Project"
          message={`Are you sure you want to delete "${deleteConfirm.project.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          type="danger"
        />
      )}
    </div>
  );
};

export default ProjectManager;