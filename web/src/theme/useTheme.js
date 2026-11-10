import { useEffect, useState } from 'react';
const KEY = 'braindy.theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');
export const readTheme = () => {
    // Light until the person picks: dark (or Auto) is a choice, not a surprise.
    try {
        const v = localStorage.getItem(KEY);
        return v === 'dark' || v === 'system' ? v : 'light';
    }
    catch {
        return 'light';
    }
};
/** Puts data-theme on <html>; "system" follows the phone or computer. index.html runs the same rule before paint. */
export function applyTheme(pref) {
    const dark = pref === 'dark' || (pref === 'system' && media().matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    // Both theme-color tags (light and dark system) follow the choice made here, so the installed app's title bar matches.
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#0B1020' : '#F4F6FB'));
}
/** The person's appearance choice on this device (light, dark or like the system). */
export function useTheme() {
    const [pref, setPref] = useState(readTheme);
    useEffect(() => {
        applyTheme(pref);
        if (pref !== 'system')
            return;
        const m = media();
        const on = () => applyTheme('system');
        m.addEventListener('change', on);
        return () => m.removeEventListener('change', on);
    }, [pref]);
    const set = (p) => { try {
        localStorage.setItem(KEY, p);
    }
    catch { /* storage blocked */ } setPref(p); };
    return { pref, set };
}
