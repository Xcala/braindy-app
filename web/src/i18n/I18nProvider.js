import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { en, es } from './strings';
const STORAGE_KEY = 'braindy.lang';
const dictionaries = { en, es };
/** The first Spanish or English entry in the browser's language list (es-CO, es-419, en-US…). Default: English. */
export function browserLang() {
    const list = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const l of list) {
        const code = String(l).toLowerCase();
        if (code.startsWith('es'))
            return 'es';
        if (code.startsWith('en'))
            return 'en';
    }
    return 'en';
}
function savedLang() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === 'en' || saved === 'es' ? saved : null;
    }
    catch {
        return null;
    }
}
/** A choice made with the EN/ES toggle wins; otherwise the browser decides. */
const initialLang = () => savedLang() ?? browserLang();
const I18nContext = createContext(null);
export function I18nProvider({ children }) {
    const [lang, setLangState] = useState(initialLang);
    useEffect(() => { document.documentElement.lang = lang; }, [lang]);
    // Follow the browser when its language changes, unless the person picked one with the toggle.
    useEffect(() => {
        const onChange = () => { if (!savedLang())
            setLangState(browserLang()); };
        window.addEventListener('languagechange', onChange);
        return () => window.removeEventListener('languagechange', onChange);
    }, []);
    const setLang = useCallback((l) => {
        setLangState(l);
        try {
            localStorage.setItem(STORAGE_KEY, l);
        }
        catch { /* storage unavailable */ }
    }, []);
    const t = useCallback((key, vars) => {
        let s = dictionaries[lang][key] ?? en[key];
        for (const [k, v] of Object.entries(vars ?? {}))
            s = s.replace(`{${k}}`, String(v));
        return s;
    }, [lang]);
    return _jsx(I18nContext.Provider, { value: { lang, setLang, t }, children: children });
}
export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx)
        throw new Error('useI18n must be used inside I18nProvider');
    return ctx;
}
