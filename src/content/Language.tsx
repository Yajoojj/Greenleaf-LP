import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en } from './en';
import { pt } from './pt';
import type { Content, Lang } from './types';

const dictionaries: Record<Lang, Content> = { pt, en };
const STORAGE_KEY = 'greenleaf-lang';

function initialLang(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (fromUrl === 'pt' || fromUrl === 'en') return fromUrl;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt' || saved === 'en') return saved;
  } catch {
    // Armazenamento indisponível (janela privada): segue com o padrão.
  }
  return 'pt';
}

interface LanguageValue { lang: Lang; content: Content; setLang: (lang: Lang) => void; }
const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const content = dictionaries[lang];

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* sem persistência */ }
    const url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    window.history.replaceState(null, '', url);
  }, []);

  useEffect(() => {
    document.documentElement.lang = content.meta.locale;
    document.title = content.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', content.meta.description);
  }, [content]);

  const value = useMemo(() => ({ lang, content, setLang }), [lang, content, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage precisa do LanguageProvider');
  return value;
}
