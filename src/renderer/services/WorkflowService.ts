import { LeoProject, ChatMessage } from '../types';
import LLMService from './LLMService';
import ProjectStorageService from './ProjectStorageService';
import MultiProjectChatManager from './MultiProjectChatManager';

/**
 * Service to handle the complete user workflow from project creation to development
 */
class WorkflowService {
  /**
   * Complete workflow: Create project from description
   */
  static async createProjectFromDescription(description: string): Promise<{
    project: LeoProject;
    messages: ChatMessage[];
  }> {
    try {
      // Step 1: Generate project using LLM
      const project = await LLMService.generateProject(description);
      
      // Step 2: Create initial chat messages
      const initialMessage: ChatMessage = {
        id: '1',
        content: 'Describe your projet',
        sender: 'agent',
        timestamp: new Date()
      };
      
      const userMessage: ChatMessage = {
        id: '2',
        content: description,
        sender: 'user',
        timestamp: new Date()
      };
      
      const responseMessage: ChatMessage = {
        id: '3',
        content: `I've generated a ${project.name} based on your description. The project includes ${project.files.length} files with Leo smart contract templates. Let's start coding!`,
        sender: 'agent',
        timestamp: new Date()
      };
      
      const messages = [initialMessage, userMessage, responseMessage];
      
      // Step 3: Update project with chat history
      const projectWithHistory = {
        ...project,
        chatHistory: messages
      };
      
      // Step 4: Save project to storage
      await ProjectStorageService.saveProject(projectWithHistory);
      
      // Step 5: Initialize chat session
      await MultiProjectChatManager.createNewProjectSession(projectWithHistory);
      
      return {
        project: projectWithHistory,
        messages
      };
    } catch (error) {
      console.error('Failed to create project from description:', error);
      throw new Error('Failed to create project. Please try again.');
    }
  }
  
  /**
   * Complete workflow: Switch to existing project
   */
  static async switchToProject(projectId: string): Promise<LeoProject> {
    try {
      // Step 1: Load project from storage
      const project = await ProjectStorageService.loadProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      
      // Step 2: Switch chat session
      await MultiProjectChatManager.switchToProject(projectId);
      
      // Step 3: Initialize project session if needed
      await MultiProjectChatManager.initializeProjectSession(project);
      
      return project;
    } catch (error) {
      console.error('Failed to switch to project:', error);
      throw new Error('Failed to load project. Please try again.');
    }
  }
  
  /**
   * Complete workflow: Save project changes
   */
  static async saveProjectChanges(project: LeoProject): Promise<void> {
    try {
      // Step 1: Update timestamp
      const updatedProject = {
        ...project,
        updatedAt: new Date()
      };
      
      // Step 2: Save to storage
      await ProjectStorageService.saveProject(updatedProject);
      
      // Step 3: Update chat session if needed
      if (updatedProject.chatHistory.length > 0) {
        await MultiProjectChatManager.updateProjectChatHistory(
          updatedProject.id,
          updatedProject.chatHistory
        );
      }
    } catch (error) {
      console.error('Failed to save project changes:', error);
      throw new Error('Failed to save changes. Please try again.');
    }
  }
  
  /**
   * Complete workflow: Delete project
   */
  static async deleteProject(projectId: string): Promise<void> {
    try {
      // Step 1: Remove from storage
      await ProjectStorageService.deleteProject(projectId);
      
      // Step 2: Remove chat session
      await MultiProjectChatManager.removeProjectSession(projectId);
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw new Error('Failed to delete project. Please try again.');
    }
  }
  
  /**
   * Validate project integrity
   */
  static validateProject(project: LeoProject): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!project.id) {
      errors.push('Project ID is required');
    }
    
    if (!project.name || project.name.trim().length === 0) {
      errors.push('Project name is required');
    }
    
    if (!project.files || project.files.length === 0) {
      errors.push('Project must have at least one file');
    }
    
    if (project.files) {
      project.files.forEach((file, index) => {
        if (!file.id) {
          errors.push(`File ${index + 1} is missing an ID`);
        }
        if (!file.name) {
          errors.push(`File ${index + 1} is missing a name`);
        }
        if (!file.path) {
          errors.push(`File ${index + 1} is missing a path`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Handle graceful error recovery
   */
  static async handleError(error: Error, context: string): Promise<void> {
    console.error(`Error in ${context}:`, error);
    
    // Log error for debugging
    const errorLog = {
      timestamp: new Date().toISOString(),
      context,
      error: error.message,
      stack: error.stack
    };
    
    // Store error log in localStorage for debugging
    try {
      const existingLogs = JSON.parse(localStorage.getItem('leoforge_error_logs') || '[]');
      existingLogs.push(errorLog);
      
      // Keep only last 50 error logs
      if (existingLogs.length > 50) {
        existingLogs.splice(0, existingLogs.length - 50);
      }
      
      localStorage.setItem('leoforge_error_logs', JSON.stringify(existingLogs));
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }
}

export default WorkflowService;