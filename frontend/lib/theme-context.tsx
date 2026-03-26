'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'ocean' | 'forest';

export const THEMES: { id: Theme; label: string; emoji: string }[] = [
  { id: 'dark',   label: 'Dark',   emoji: '🌑' },
  { id: 'light',  label: 'Light',  emoji: '☀️' },
  { id: 'ocean',  label: 'Ocean',  emoji: '🌊' },
  { id: 'forest', label: 'Forest', emoji: '🌲' },
];

export type ThemeColors = {
  bg: string; bgCard: string; bgElevated: string; bgSidebar: string; bgHover: string;
  text: string; text2: string; textSecondary: string; textMuted: string; textDim: string;
  border: string; borderSubtle: string; borderStrong: string;
};

const PALETTES: Record<Theme, ThemeColors> = {
  dark: {
    bg: '#0f0f14', bgCard: '#1a1a24', bgElevated: '#12121a', bgSidebar: '#13131c', bgHover: '#2a2a38',
    text: '#f0f0f5', text2: '#d0d0e0', textSecondary: '#9999bb', textMuted: '#60607a', textDim: '#50505e',
    border: '#2a2a38', borderSubtle: '#22223a', borderStrong: '#3a3a50',
  },
  light: {
    bg: '#f3f4f6', bgCard: '#ffffff', bgElevated: '#f9fafb', bgSidebar: '#ffffff', bgHover: '#e5e7eb',
    text: '#111827', text2: '#1f2937', textSecondary: '#374151', textMuted: '#6b7280', textDim: '#9ca3af',
    border: '#e5e7eb', borderSubtle: '#f3f4f6', borderStrong: '#d1d5db',
  },
  ocean: {
    bg: '#051830', bgCard: '#0a2448', bgElevated: '#071e3d', bgSidebar: '#061a35', bgHover: '#0e2f5a',
    text: '#bae6fd', text2: '#7dd3fc', textSecondary: '#38bdf8', textMuted: '#0ea5e9', textDim: '#0369a1',
    border: '#1a4a7a', borderSubtle: '#0e3060', borderStrong: '#2a6aaa',
  },
  forest: {
    bg: '#061209', bgCard: '#0b2213', bgElevated: '#081a0e', bgSidebar: '#071810', bgHover: '#112e18',
    text: '#d1fae5', text2: '#a7f3d0', textSecondary: '#34d399', textMuted: '#10b981', textDim: '#065f46',
    border: '#145a32', borderSubtle: '#0d4224', borderStrong: '#1a7a42',
  },
};

type Ctx = { theme: Theme; colors: ThemeColors; setTheme: (t: Theme) => void };
const ThemeContext = createContext<Ctx>({ theme: 'dark', colors: PALETTES.dark, setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('fin-theme') as Theme | null;
    if (saved && PALETTES[saved]) {
      setThemeState(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem('fin-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }

  return (
    <ThemeContext.Provider value={{ theme, colors: PALETTES[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
