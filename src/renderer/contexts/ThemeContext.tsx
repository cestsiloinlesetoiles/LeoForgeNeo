import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme } from '../types';
import { ThemeService } from '../services/ThemeService';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => ThemeService.initialize());
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Apply theme changes
    ThemeService.applyTheme(theme);
    ThemeService.saveTheme(theme);
    
    // Handle transition state
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 200);
    
    return () => clearTimeout(timer);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = ThemeService.toggleTheme(theme);
    setThemeState(newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    if (newTheme !== theme) {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};