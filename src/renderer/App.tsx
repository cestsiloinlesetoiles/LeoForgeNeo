import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider, useApp } from './contexts/AppContext';
import WelcomeScreen from './components/WelcomeScreen';
import MainInterface from './components/MainInterface';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/themes.css';
import './App.css';

const AppContent: React.FC = () => {
  const { state, loadProjects } = useApp();

  // Load projects on app initialization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadProjects();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, [loadProjects]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N for new project
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        // This will be handled by the components
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app">
      <ErrorBoundary>
        {state.currentView === 'welcome' ? (
          <ErrorBoundary fallback={
            <div className="error-fallback">
              <p>Failed to load welcome screen. Please refresh the application.</p>
            </div>
          }>
            <WelcomeScreen />
          </ErrorBoundary>
        ) : (
          <ErrorBoundary fallback={
            <div className="error-fallback">
              <p>Failed to load main interface. Please refresh the application.</p>
            </div>
          }>
            <MainInterface />
          </ErrorBoundary>
        )}
      </ErrorBoundary>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <ErrorBoundary>
            <AppProvider>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </AppProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;