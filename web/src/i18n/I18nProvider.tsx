import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { en, es, type StringKey } from './strings';
import { LangChooser } from './LangChooser';

export type Lang = 'en' | 'es';
const STORAGE_KEY = 'braindy.lang';
const dictionaries: Record<Lang, Record<StringKey, string>> = { en, es };

/** The browser's first language, as the app's language when it is Spanish or English; null for any other. */
export function browserLang(): Lang | null {
  const code = String(navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase();
  return code.startsWith('es') ? 'es' : code.startsWith('en') ? 'en' : null;
}
const browserCode = () => String(navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase();

/** A choice made with the EN/ES toggle (or the chooser) holds while the browser keeps the language it was made under. */
function savedLang(): Lang | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const v = raw?.startsWith('{') ? (JSON.parse(raw) as { lang?: string; browser?: string }) : null;
    return v && (v.lang === 'en' || v.lang === 'es') && v.browser === browserCode() ? v.lang : null;
  } catch { return null; }
}

/** The browser decides when it speaks Spanish or English; for any other language the person picks once. */
const initialLang = (): Lang => savedLang() ?? browserLang() ?? 'en';
const mustChoose = () => !savedLang() && !browserLang();

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [choose, setChoose] = useState(mustChoose);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  // Follow the browser when its language changes, unless the person picked one under the current browser language.
  useEffect(() => {
    const onChange = () => { if (!savedLang()) { setLangState(browserLang() ?? 'en'); setChoose(mustChoose()); } };
    window.addEventListener('languagechange', onChange);
    return () => window.removeEventListener('languagechange', onChange);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setChoose(false);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ lang: l, browser: browserCode() })); } catch { /* storage unavailable */ }
  }, []);

  const t = useCallback<I18n['t']>((key, vars) => {
    let s = dictionaries[lang][key] ?? en[key];
    for (const [k, v] of Object.entries(vars ?? {})) s = s.replace(`{${k}}`, String(v));
    return s;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
      {choose && <LangChooser onPick={setLang} />}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
