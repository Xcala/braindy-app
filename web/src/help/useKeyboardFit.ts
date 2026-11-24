import { useEffect } from 'react';

/** Phones (2026-11-23): when the keyboard opens, the browser scrolls the full-screen chat up and its top (header, greeting,
 *  suggestions) went off screen, leaving an empty area over the box. The chat follows the part of the screen still visible. */
export function useKeyboardFit(on: boolean) {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!on || !vv) return;
    const root = document.documentElement.style;
    const fit = () => { root.setProperty('--vv-h', `${vv.height}px`); root.setProperty('--vv-top', `${vv.offsetTop}px`); };
    fit();
    vv.addEventListener('resize', fit);
    vv.addEventListener('scroll', fit);
    return () => { vv.removeEventListener('resize', fit); vv.removeEventListener('scroll', fit); root.removeProperty('--vv-h'); root.removeProperty('--vv-top'); };
  }, [on]);
}
