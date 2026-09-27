'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeOption = 'blue' | 'green' | 'red' | 'yellow' | 'white';

interface ThemeContextType {
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'blue',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeOption>('blue');

  useEffect(() => {
    const savedTheme = localStorage.getItem('velvet_theme') as ThemeOption;
    if (savedTheme && ['blue', 'green', 'red'].includes(savedTheme)) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'blue');
    }
  }, []);

  const setTheme = (newTheme: ThemeOption) => {
    setThemeState(newTheme);
    localStorage.setItem('velvet_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);