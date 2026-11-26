import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import './pushDrawer.css';

/**
 * Phones (2026-11-21): the menu button pushes the whole app to the right and the sidebar shows on the left, behind it
 * (the app stays in view, so you know where you were). A tap or a swipe left on the app, Esc, or picking a page closes it.
 * State lives as a class on <html> so the sidebar, the top bar button and the app column read it without wiring.
 */
const OPEN = 'nav-open';
// Opening fixes the app to the screen (so its bottom bar and buttons stay put while it slides) and keeps the reading place.
let scrollY = 0;
function set(v: boolean) {
  const el = document.documentElement;
  if (v === el.classList.contains(OPEN)) return;
  const app = document.querySelector<HTMLElement>('.pd-app');
  if (v) {
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    scrollY = window.scrollY;
    el.classList.add(OPEN);
    if (app) app.scrollTop = scrollY;
  } else {
    el.classList.remove(OPEN);
    window.scrollTo({ top: scrollY, behavior: 'instant' });
  }
}
export const toggleDrawer = () => set(!document.documentElement.classList.contains(OPEN));

export function useDrawerOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const mo = new MutationObserver(() => setOpen(el.classList.contains(OPEN)));
    mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  return open;
}

export function MenuButton() {
  const { t } = useI18n();
  const open = useDrawerOpen();
  return (
    <button type="button" className="btn btn-ghost btn-sm btn-icon pd-btn md:hidden" aria-label={t(open ? 'nav.closeMenu' : 'nav.menu')} aria-expanded={open} onClick={toggleDrawer}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16" /></svg>
    </button>
  );
}

/** The see-through layer over the pushed app: tap or swipe left to close. Also closes on page change, Esc and when the screen gets wide. */
export function DrawerScrim() {
  const { t } = useI18n();
  const open = useDrawerOpen();
  const { pathname } = useLocation();
  const x0 = useRef<number | null>(null);
  useEffect(() => { set(false); }, [pathname]);
  // The assistant opens inside the app: close the menu so it is in view.
  useEffect(() => { const off = () => set(false); window.addEventListener('bd-help-toggle', off); return () => window.removeEventListener('bd-help-toggle', off); }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') set(false); };
    const wide = window.matchMedia('(min-width: 768px)');
    const onWide = () => { if (wide.matches) set(false); };
    window.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => { window.removeEventListener('keydown', onKey); wide.removeEventListener('change', onWide); };
  }, [open]);
  if (!open) return null;
  return (
    <button type="button" className="pd-scrim" aria-label={t('nav.closeMenu')} onClick={() => set(false)}
      onTouchStart={(e) => { x0.current = e.touches[0]!.clientX; }}
      onTouchEnd={(e) => { if (x0.current !== null && x0.current - e.changedTouches[0]!.clientX > 40) set(false); x0.current = null; }} />
  );
}
