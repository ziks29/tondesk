'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { miniApp, useSignal } from '@tma.js/sdk-react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tondesk_theme') as Theme;
      if (saved) return saved;
    }
    return 'system';
  });
  const tmaIsDark = useSignal(miniApp.isDark);

  const isDarkMode = theme === 'system' ? !!tmaIsDark : theme === 'dark';

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('tondesk_theme', newTheme);

    // Apply class immediately for instant feedback
    const applyDark = newTheme === 'system' ? !!tmaIsDark : newTheme === 'dark';
    if (applyDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Keep it in sync if system theme changes or provider initializes with dark
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
