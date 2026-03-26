'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lang, translations } from './translations';

type LangCtx = {
  lang: Lang;
  langReady: boolean;
  setLang: (l: Lang) => void;
  t: (path: string) => string;
};

const LangContext = createContext<LangCtx>({
  lang: 'en',
  langReady: false,
  setLang: () => {},
  t: (p) => p,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('fin-lang') as Lang | null;
    if (saved === 'en' || saved === 'es') setLangState(saved);
    setLangReady(true);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('fin-lang', l);
  }

  function t(path: string): string {
    const parts = path.split('.');
    let obj: unknown = translations[lang];
    for (const p of parts) {
      if (obj == null || typeof obj !== 'object') return path;
      obj = (obj as Record<string, unknown>)[p];
    }
    return typeof obj === 'string' ? obj : path;
  }

  return (
    <LangContext.Provider value={{ lang, langReady, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
