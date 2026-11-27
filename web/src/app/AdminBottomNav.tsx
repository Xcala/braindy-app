import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { NAV_ICON } from './navIcons';
import { useWaWaitingCount } from '../whatsapp/useWaInbox';
import '../whatsapp/whatsapp.css';

/** The admin pages. The first four sit in the phone's bottom bar; the rest open from "More". Desktop lists them all in the sidebar. */
export const ADMIN_TABS: Array<{ to: string; label: StringKey }> = [
  { to: '/admin/today', label: 'today.title' },
  { to: '/admin/studio', label: 'st.nav' },
  { to: '/admin/brands', label: 'nav.brands' },
  { to: '/admin/proposals', label: 'nav.proposals' },
  { to: '/admin/onboarding', label: 'nav.onboarding' },
  { to: '/admin/billing', label: 'nav.billing' },
  { to: '/admin/costs', label: 'cost.nav' },
  { to: '/admin/ai', label: 'aih.nav' },
  { to: '/admin/usage', label: 'pv.nav' },
  { to: '/admin/whatsapp', label: 'waa.nav' },
  { to: '/admin/criterio', label: 'cra.nav' },
];
// Decision 1 (2026-11-24): Today, Brands and WhatsApp in the bar; the rest under More.
const FIXED_TO = ['/admin/today', '/admin/brands', '/admin/whatsapp'];
const FIXED_TABS = ADMIN_TABS.filter((i) => FIXED_TO.includes(i.to));

/** Admin on a phone: Today · Brands · WhatsApp · More, the same bar and the same «More» sheet the client has. */
export function AdminBottomNav() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const moreBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const rest = ADMIN_TABS.filter((i) => !FIXED_TO.includes(i.to));
  const inRest = rest.some((r) => pathname === r.to || pathname.startsWith(`${r.to}/`));
  // How many numbers wait on WhatsApp (the same live query the WhatsApp page uses).
  const waWaiting = useWaWaitingCount();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', key); };
  }, [open]);
  function close() { setOpen(false); moreBtn.current?.focus(); }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 md:hidden"><nav className="bnav" aria-label={t('nav.sections')}>
        {FIXED_TABS.map((i) => {
          const badge = i.to === '/admin/whatsapp' && waWaiting > 0 ? waWaiting : 0;
          return (
            <NavLink key={i.to} to={i.to} className={({ isActive }) => `${isActive ? 'is-active' : ''}${badge ? ' wa-has-badge' : ''}`}
              aria-label={badge ? `${t(i.label)} · ${t('wa.badge', { n: badge })}` : undefined}>
              {NAV_ICON[i.to]}{t(i.label)}
              {badge ? <span className="wa-badge" aria-hidden="true">{badge > 99 ? '99+' : badge}</span> : null}
            </NavLink>
          );
        })}
        <button ref={moreBtn} type="button" className={inRest || open ? 'is-active' : ''} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(true)}>
          {NAV_ICON.more}{t('nav.more')}
        </button>
      </nav></div>
      {open && createPortal(
        <div className="acct-sheet" role="dialog" aria-modal="true" aria-label={t('nav.moreTitle')}>
          <div className="acct-sheet-bar">
            <img className="logo" src="/brand/braindy-logo.svg" alt="Braindy" />
            <button ref={closeBtn} type="button" className="acct-x" onClick={close} aria-label={t('lb.close')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <div className="acct-sheet-body col g20">
            <h2 className="h2" style={{ margin: 0 }}>{t('nav.moreTitle')}</h2>
            <div className="more-card">{rest.map((i) => (
              <NavLink key={i.to} to={i.to} end className={({ isActive }) => `more-link${isActive ? ' is-on' : ''}`}>
                <span className="more-ico">{NAV_ICON[i.to]}</span><span className="grow">{t(i.label)}</span>
              </NavLink>
            ))}</div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
