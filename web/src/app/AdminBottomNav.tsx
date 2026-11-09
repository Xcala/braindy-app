import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { NAV_ICON } from './navIcons';

/** The admin pages. The first four sit in the phone's bottom bar; the rest open from "More". Desktop lists them all in the sidebar. */
export const ADMIN_TABS: Array<{ to: string; label: StringKey }> = [
  { to: '/admin/today', label: 'today.title' },
  { to: '/admin/studio', label: 'st.nav' },
  { to: '/admin/brands', label: 'nav.brands' },
  { to: '/admin/proposals', label: 'nav.proposals' },
  { to: '/admin/onboarding', label: 'nav.onboarding' },
  { to: '/admin/billing', label: 'nav.billing' },
  { to: '/admin/costs', label: 'cost.nav' },
  { to: '/team', label: 'nav.team' },
  { to: '/admin/whatsapp', label: 'waa.nav' },
  { to: '/admin/criterio', label: 'cra.nav' },
];
const FIXED = 4;

const dots = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></svg>;

/** Admin on a phone: Today · Studio · Brands · Proposals · More, the same bar the client has. */
export function AdminBottomNav() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const moreBtn = useRef<HTMLButtonElement>(null);
  const rest = ADMIN_TABS.slice(FIXED);
  const inRest = rest.some((r) => pathname === r.to || pathname.startsWith(`${r.to}/`));

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); moreBtn.current?.focus(); } };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open]);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 md:hidden"><nav className="bnav" aria-label={t('nav.sections')}>
        {ADMIN_TABS.slice(0, FIXED).map((i) => (
          <NavLink key={i.to} to={i.to} className={({ isActive }) => (isActive ? 'is-active' : '')}>{NAV_ICON[i.to]}{t(i.label)}</NavLink>
        ))}
        <button ref={moreBtn} type="button" className={`bnav-more${inRest || open ? ' is-active' : ''}`} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((o) => !o)}>
          {dots}{t('anav.more')}
        </button>
      </nav></div>
      {open && createPortal(
        <div className="amore" role="dialog" aria-modal="true" aria-label={t('anav.moreTitle')} onClick={() => setOpen(false)}>
          <div className="amore-panel" onClick={(e) => e.stopPropagation()}>
            <p className="label" style={{ padding: '4px 8px 8px' }}>{t('anav.moreTitle')}</p>
            {rest.map((i) => (
              <NavLink key={i.to} to={i.to} className={({ isActive }) => `amore-item${isActive ? ' is-on' : ''}`}>
                <span className="amore-ico">{NAV_ICON[i.to]}</span>{t(i.label)}
              </NavLink>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
