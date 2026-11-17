import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { sectionOfPath, useMySections } from '../team/sections';
import { FOOT_NAV, NAV } from './navGroups';
import { NAV_ICON } from './navIcons';
import { useFilled } from './SubNav';

/** Phones: the «More» tab opens every page this person may use (each section's pages, then Learn, Wishlist and Account). */
export function MoreButton() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
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
  function close() { setOpen(false); btn.current?.focus(); }

  const x = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>;
  return (
    <>
      <button ref={btn} type="button" className={open ? 'is-active' : ''} onClick={() => setOpen(true)} aria-expanded={open} aria-haspopup="dialog">
        {NAV_ICON.more}{t('nav.more')}
      </button>
      {open && createPortal(
        <div className="acct-sheet" role="dialog" aria-modal="true" aria-label={t('nav.moreTitle')}>
          <div className="acct-sheet-bar">
            <img className="logo" src="/brand/braindy-logo.svg" alt="Braindy" />
            <button ref={closeBtn} type="button" className="acct-x" onClick={close} aria-label={t('lb.close')}>{x}</button>
          </div>
          <div className="acct-sheet-body col g20">
            <h2 className="h2" style={{ margin: 0 }}>{t('nav.moreTitle')}</h2>
            <MoreList />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function MoreList() {
  const { t } = useI18n();
  const { can } = useMySections();
  const filled = useFilled();
  const isAdmin = useAuth().profile?.role === 'admin';
  // Same rule as the sidebar: a page with nothing in it stays out for the client.
  const groups = [...NAV, ...FOOT_NAV].map((g) => ({ g, pages: g.pages.filter((p) => can(sectionOfPath(p.to)) && (isAdmin || g.pages.length === 1 || filled(p.to))) }))
    .filter((x) => x.pages.length);
  const link = (to: string, label: string) => (
    <NavLink key={to} to={to} end className={({ isActive }) => `more-link${isActive ? ' is-on' : ''}`}>
      <span className="more-ico">{NAV_ICON[to] ?? NAV_ICON['/home']}</span><span className="grow">{label}</span>
    </NavLink>
  );
  return (
    <>
      {groups.map(({ g, pages }) => (
        <section key={g.label} className="col g8">
          {pages.length > 1 && <p className="label" style={{ margin: 0 }}>{t(g.label)}</p>}
          <div className="more-card">{pages.map((p) => link(p.to, t(pages.length > 1 ? p.label : g.label)))}</div>
        </section>
      ))}
    </>
  );
}
