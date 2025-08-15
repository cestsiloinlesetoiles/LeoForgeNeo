import { LeoProject, LeoFile } from '../types';

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  fileCount: number;
  size: number; // in bytes
}

export interface StorageStats {
  totalProjects: number;
  totalSize: number;
  lastCleanup: Date;
}

class ProjectStorageService {
  private static instance: ProjectStorageService;
  private readonly STORAGE_PREFIX = 'leoforge_project_';
  private readonly METADATA_KEY = 'leoforge_projects_metadata';
  private readonly STATS_KEY = 'leoforge_storage_stats';

  private constructor() {}

  static getInstance(): ProjectStorageService {
    if (!ProjectStorageService.instance) {
      ProjectStorageService.instance = new ProjectStorageService();
    }
    return ProjectStorageService.instance;
  }

  /**
   * Save a project to local storage
   */
  async saveProject(project: LeoProject): Promise<void> {
    try {
      // Update project timestamp
      const updatedProject = {
        ...project,
        updatedAt: new Date()
      };

      // Save project data
      const projectKey = this.getProjectKey(project.id);
      const projectData = JSON.stringify(updatedProject, this.dateReplacer);
      localStorage.setItem(projectKey, projectData);

      // Update metadata
      await this.updateProjectMetadata(updatedProject);
      
      // Update storage stats
      await this.updateStorageStats();

      console.log(`Project ${project.name} saved successfully`);
    } catch (error) {
      console.error('Failed to save project:', error);
      throw new Error(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load a project from local storage
   */
  async loadProject(projectId: string): Promise<LeoProject | null> {
    try {
      const projectKey = this.getProjectKey(projectId);
      const projectData = localStorage.getItem(projectKey);
      
      if (!projectData) {
        return null;
      }

      const project = JSON.parse(projectData, this.dateReviver) as LeoProject;
      
      // Update last accessed time
      await this.updateLastAccessed(projectId);
      
      return project;
    } catch (error) {
      console.error('Failed to load project:', error);
      throw new Error(`Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all project metadata (without full project data)
   */
  async getAllProjectsMetadata(): Promise<ProjectMetadata[]> {
    try {
      const metadataJson = localStorage.getItem(this.METADATA_KEY);
      if (!metadataJson) {
        return [];
      }

      const metadata = JSON.parse(metadataJson, this.dateReviver) as ProjectMetadata[];
      return metadata.sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime());
    } catch (error) {
      console.error('Failed to load projects metadata:', error);
      return [];
    }
  }

  /**
   * Delete a project from local storage
   */
  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const projectKey = this.getProjectKey(projectId);
      
      // Check if project exists
      if (!localStorage.getItem(projectKey)) {
        return false;
      }

      // Remove project data
      localStorage.removeItem(projectKey);

      // Remove from metadata
      await this.removeProjectMetadata(projectId);
      
      // Update storage stats
      await this.updateStorageStats();

      console.log(`Project ${projectId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a project exists in storage
   */
  async projectExists(projectId: string): Promise<boolean> {
    const projectKey = this.getProjectKey(projectId);
    return localStorage.getItem(projectKey) !== null;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const statsJson = localStorage.getItem(this.STATS_KEY);
      if (!statsJson) {
        const defaultStats: StorageStats = {
          totalProjects: 0,
          totalSize: 0,
          lastCleanup: new Date()
        };
        await this.saveStorageStats(defaultStats);
        return defaultStats;
      }

      return JSON.parse(statsJson, this.dateReviver) as StorageStats;
    } catch (error) {
      console.error('Failed to load storage stats:', error);
      return {
        totalProjects: 0,
        totalSize: 0,
        lastCleanup: new Date()
      };
    }
  }

  /**
   * Clean up old or corrupted projects
   */
  async cleanupStorage(): Promise<{ cleaned: number; errors: string[] }> {
    const errors: string[] = [];
    let cleaned = 0;

    try {
      const metadata = await this.getAllProjectsMetadata();
      
      for (const meta of metadata) {
        try {
          const project = await this.loadProject(meta.id);
          if (!project) {
            // Remove orphaned metadata
            await this.removeProjectMetadata(meta.id);
            cleaned++;
          }
        } catch (error) {
          errors.push(`Failed to validate project ${meta.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Remove corrupted project
          await this.deleteProject(meta.id);
          cleaned++;
        }
      }

      // Update cleanup timestamp
      const stats = await this.getStorageStats();
      stats.lastCleanup = new Date();
      await this.saveStorageStats(stats);

      console.log(`Storage cleanup completed: ${cleaned} items cleaned, ${errors.length} errors`);
      return { cleaned, errors };
    } catch (error) {
      console.error('Storage cleanup failed:', error);
      return { cleaned, errors: [...errors, `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`] };
    }
  }

  /**
   * Export project data for backup
   */
  async exportProjectData(projectId: string): Promise<string> {
    const project = await this.loadProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    return JSON.stringify(project, this.dateReplacer, 2);
  }

  /**
   * Import project data from backup
   */
  async importProjectData(projectData: string): Promise<LeoProject> {
    try {
      const project = JSON.parse(projectData, this.dateReviver) as LeoProject;
      
      // Validate project structure
      if (!project.id || !project.name || !Array.isArray(project.files)) {
        throw new Error('Invalid project data structure');
      }

      // Generate new ID if project already exists
      if (await this.projectExists(project.id)) {
        project.id = this.generateProjectId();
        project.name = `${project.name} (Imported)`;
      }

      await this.saveProject(project);
      return project;
    } catch (error) {
      throw new Error(`Failed to import project: ${error instanceof Error ? error.message : 'Invalid JSON data'}`);
    }
  }

  // Private helper methods

  private getProjectKey(projectId: string): string {
    return `${this.STORAGE_PREFIX}${projectId}`;
  }

  private generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async updateProjectMetadata(project: LeoProject): Promise<void> {
    const metadata = await this.getAllProjectsMetadata();
    const existingIndex = metadata.findIndex(m => m.id === project.id);
    
    const projectMetadata: ProjectMetadata = {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lastAccessedAt: new Date(),
      fileCount: project.files.length,
      size: this.calculateProjectSize(project)
    };

    if (existingIndex >= 0) {
      metadata[existingIndex] = projectMetadata;
    } else {
      metadata.push(projectMetadata);
    }

    localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata, this.dateReplacer));
  }

  private async removeProjectMetadata(projectId: string): Promise<void> {
    const metadata = await this.getAllProjectsMetadata();
    const filteredMetadata = metadata.filter(m => m.id !== projectId);
    localStorage.setItem(this.METADATA_KEY, JSON.stringify(filteredMetadata, this.dateReplacer));
  }

  private async updateLastAccessed(projectId: string): Promise<void> {
    const metadata = await this.getAllProjectsMetadata();
    const projectMeta = metadata.find(m => m.id === projectId);
    
    if (projectMeta) {
      projectMeta.lastAccessedAt = new Date();
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata, this.dateReplacer));
    }
  }

  private async updateStorageStats(): Promise<void> {
    const metadata = await this.getAllProjectsMetadata();
    const stats: StorageStats = {
      totalProjects: metadata.length,
      totalSize: metadata.reduce((total, meta) => total + meta.size, 0),
      lastCleanup: (await this.getStorageStats()).lastCleanup
    };

    await this.saveStorageStats(stats);
  }

  private async saveStorageStats(stats: StorageStats): Promise<void> {
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats, this.dateReplacer));
  }

  private calculateProjectSize(project: LeoProject): number {
    const projectJson = JSON.stringify(project);
    return new Blob([projectJson]).size;
  }

  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }
}

export default ProjectStorageService.getInstance();