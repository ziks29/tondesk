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
  const [theme, setThemeState] = useState<Theme>('system');
  const tmaIsDark = useSignal(miniApp.isDark);

  useEffect(() => {
    const saved = localStorage.getItem('tondesk_theme') as Theme;
    if (saved) setThemeState(saved);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('tondesk_theme', newTheme);
  };

  const isDarkMode = theme === 'system' ? !!tmaIsDark : theme === 'dark';

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
