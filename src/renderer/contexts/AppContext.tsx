import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, LeoProject } from '../types';
import ProjectStorageService from '../services/ProjectStorageService';
import MultiProjectChatManager from '../services/MultiProjectChatManager';

type AppAction =
  | { type: 'SET_VIEW'; payload: 'welcome' | 'main' }
  | { type: 'SET_CURRENT_PROJECT'; payload: LeoProject | null }
  | { type: 'ADD_PROJECT'; payload: LeoProject }
  | { type: 'UPDATE_PROJECT'; payload: LeoProject }
  | { type: 'REMOVE_PROJECT'; payload: string }
  | { type: 'LOAD_PROJECTS'; payload: LeoProject[] }
  | { type: 'SET_LOADING'; payload: boolean };

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setView: (view: 'welcome' | 'main') => void;
  setCurrentProject: (project: LeoProject | null) => void;
  addProject: (project: LeoProject) => void;
  updateProject: (project: LeoProject) => void;
  removeProject: (projectId: string) => void;
  loadProjects: () => Promise<void>;
  switchToProject: (projectId: string) => Promise<void>;
  createNewProject: () => void;
}

const initialState: AppState = {
  currentView: 'welcome',
  theme: 'dark',
  currentProject: null,
  projects: []
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
    case 'ADD_PROJECT':
      return { 
        ...state, 
        projects: [...state.projects, action.payload],
        currentProject: action.payload
      };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload.id ? action.payload : p
        ),
        currentProject: state.currentProject?.id === action.payload.id 
          ? action.payload 
          : state.currentProject
      };
    case 'REMOVE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload 
          ? null 
          : state.currentProject
      };
    case 'LOAD_PROJECTS':
      return {
        ...state,
        projects: action.payload
      };
    case 'SET_LOADING':
      return {
        ...state,
        // We can add a loading state to AppState if needed
      };
    default:
      return state;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize auto-save for chat sessions
  useEffect(() => {
    MultiProjectChatManager.startAutoSave();
  }, []);

  const setView = (view: 'welcome' | 'main') => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  const setCurrentProject = async (project: LeoProject | null) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
    
    if (project) {
      // Initialize chat session for the project
      await MultiProjectChatManager.initializeProjectSession(project);
    }
  };

  const addProject = async (project: LeoProject) => {
    try {
      // Save to storage
      await ProjectStorageService.saveProject(project);
      
      // Initialize chat session
      await MultiProjectChatManager.createNewProjectSession(project);
      
      dispatch({ type: 'ADD_PROJECT', payload: project });
    } catch (error) {
      console.error('Failed to add project:', error);
      throw error;
    }
  };

  const updateProject = async (project: LeoProject) => {
    try {
      // Save to storage
      await ProjectStorageService.saveProject(project);
      
      dispatch({ type: 'UPDATE_PROJECT', payload: project });
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  };

  const removeProject = async (projectId: string) => {
    try {
      // Remove from storage
      await ProjectStorageService.deleteProject(projectId);
      
      // Remove chat session
      await MultiProjectChatManager.removeProjectSession(projectId);
      
      dispatch({ type: 'REMOVE_PROJECT', payload: projectId });
    } catch (error) {
      console.error('Failed to remove project:', error);
      throw error;
    }
  };

  const loadProjects = async () => {
    try {
      const projectsMetadata = await ProjectStorageService.getAllProjectsMetadata();
      const projects: LeoProject[] = [];
      
      // Load full project data for recent projects (limit to avoid performance issues)
      const recentProjects = projectsMetadata.slice(0, 10);
      
      for (const metadata of recentProjects) {
        try {
          const project = await ProjectStorageService.loadProject(metadata.id);
          if (project) {
            projects.push(project);
          }
        } catch (error) {
          console.error(`Failed to load project ${metadata.name}:`, error);
        }
      }
      
      dispatch({ type: 'LOAD_PROJECTS', payload: projects });
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const switchToProject = async (projectId: string) => {
    try {
      const project = await ProjectStorageService.loadProject(projectId);
      if (project) {
        await MultiProjectChatManager.switchToProject(projectId);
        dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
        dispatch({ type: 'SET_VIEW', payload: 'main' });
      }
    } catch (error) {
      console.error('Failed to switch to project:', error);
      throw error;
    }
  };

  const createNewProject = () => {
    dispatch({ type: 'SET_VIEW', payload: 'welcome' });
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: null });
  };

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      setView,
      setCurrentProject,
      addProject,
      updateProject,
      removeProject,
      loadProjects,
      switchToProject,
      createNewProject
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};