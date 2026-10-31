import { useEffect, useState } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';
const KEY = 'braindy.theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export const readTheme = (): ThemePref => {
  try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'system'; } catch { return 'system'; }
};

/** Puts data-theme on <html>; "system" follows the phone or computer. index.html runs the same rule before paint. */
export function applyTheme(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && media().matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0B1020' : '#F4F6FB');
}

/** The person's appearance choice on this device (light, dark or like the system). */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readTheme);
  useEffect(() => {
    applyTheme(pref);
    if (pref !== 'system') return;
    const m = media();
    const on = () => applyTheme('system');
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [pref]);
  const set = (p: ThemePref) => { try { localStorage.setItem(KEY, p); } catch { /* storage blocked */ } setPref(p); };
  return { pref, set };
}
