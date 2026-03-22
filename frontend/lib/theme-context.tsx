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
    bg: '#060d1a', bgCard: '#0d1628', bgElevated: '#071020', bgSidebar: '#08111e', bgHover: '#142035',
    text: '#e2e8f0', text2: '#cbd5e1', textSecondary: '#94a3b8', textMuted: '#64748b', textDim: '#475569',
    border: '#1a3050', borderSubtle: '#0f2040', borderStrong: '#2a4a7a',
  },
  forest: {
    bg: '#060f0a', bgCard: '#0d1f12', bgElevated: '#071409', bgSidebar: '#08170d', bgHover: '#12281a',
    text: '#dcfce7', text2: '#bbf7d0', textSecondary: '#86efac', textMuted: '#4ade80', textDim: '#166534',
    border: '#14532d', borderSubtle: '#0f3d22', borderStrong: '#166534',
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
