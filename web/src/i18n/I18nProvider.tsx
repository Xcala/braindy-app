import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { en, es, type StringKey } from './strings';

export type Lang = 'en' | 'es';
const STORAGE_KEY = 'braindy.lang';
const dictionaries: Record<Lang, Record<StringKey, string>> = { en, es };

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') return saved;
  } catch { /* storage unavailable */ }
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* storage unavailable */ }
  }, []);

  const t = useCallback<I18n['t']>((key, vars) => {
    let s = dictionaries[lang][key] ?? en[key];
    for (const [k, v] of Object.entries(vars ?? {})) s = s.replace(`{${k}}`, String(v));
    return s;
  }, [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
