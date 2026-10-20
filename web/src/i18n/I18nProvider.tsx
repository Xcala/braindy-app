import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { en, es, type StringKey } from './strings';

export type Lang = 'en' | 'es';
const STORAGE_KEY = 'braindy.lang';
const dictionaries: Record<Lang, Record<StringKey, string>> = { en, es };

/** The first Spanish or English entry in the browser's language list (es-CO, es-419, en-US…). Default: English. */
export function browserLang(): Lang {
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const l of list) {
    const code = String(l).toLowerCase();
    if (code.startsWith('es')) return 'es';
    if (code.startsWith('en')) return 'en';
  }
  return 'en';
}

function savedLang(): Lang | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' || saved === 'es' ? saved : null;
  } catch { return null; }
}

/** A choice made with the EN/ES toggle wins; otherwise the browser decides. */
const initialLang = (): Lang => savedLang() ?? browserLang();

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  // Follow the browser when its language changes, unless the person picked one with the toggle.
  useEffect(() => {
    const onChange = () => { if (!savedLang()) setLangState(browserLang()); };
    window.addEventListener('languagechange', onChange);
    return () => window.removeEventListener('languagechange', onChange);
  }, []);

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
