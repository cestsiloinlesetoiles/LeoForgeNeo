import { Theme } from '../types';

export class ThemeService {
  private static readonly STORAGE_KEY = 'leoforge-theme';
  private static readonly DEFAULT_THEME: Theme = 'dark';

  /**
   * Get the current theme from localStorage or return default
   */
  static getCurrentTheme(): Theme {
    try {
      const savedTheme = localStorage.getItem(this.STORAGE_KEY) as Theme;
      return savedTheme && (savedTheme === 'dark' || savedTheme === 'light') 
        ? savedTheme 
        : this.DEFAULT_THEME;
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
      return this.DEFAULT_THEME;
    }
  }

  /**
   * Save theme to localStorage
   */
  static saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }

  /**
   * Apply theme to document root
   */
  static applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Add theme transition class for smooth switching
    document.documentElement.classList.add('theme-transitioning');
    
    // Remove transition class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 200);
  }

  /**
   * Toggle between dark and light themes
   */
  static toggleTheme(currentTheme: Theme): Theme {
    return currentTheme === 'dark' ? 'light' : 'dark';
  }

  /**
   * Get theme-specific Monaco editor theme name
   */
  static getMonacoTheme(theme: Theme): string {
    return theme === 'dark' ? 'vs-dark' : 'vs';
  }

  /**
   * Get system theme preference
   */
  static getSystemTheme(): Theme {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.DEFAULT_THEME;
  }

  /**
   * Initialize theme system
   */
  static initialize(): Theme {
    const savedTheme = this.getCurrentTheme();
    this.applyTheme(savedTheme);
    return savedTheme;
  }

  /**
   * Listen for system theme changes
   */
  static watchSystemTheme(callback: (theme: Theme) => void): () => void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return () => {}; // No-op cleanup function
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const systemTheme = e.matches ? 'dark' : 'light';
      callback(systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);

    // Return cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }

  /**
   * Get CSS custom property value for current theme
   */
  static getCSSVariable(property: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
  }

  /**
   * Set CSS custom property value
   */
  static setCSSVariable(property: string, value: string): void {
    document.documentElement.style.setProperty(property, value);
  }
}