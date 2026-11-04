import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { useRequests } from '../requests/useRequests';
import { sectionOfPath, useMySections } from '../team/sections';
import { NAV } from './navGroups';
import { NAV_ICON } from './navIcons';
import { useFilled } from './SubNav';
import './sidebar.css';

type Item = { to: string; label: StringKey };
const KEY = 'braindy.sidebar';
const savedSlim = () => { try { return localStorage.getItem(KEY) === 'slim'; } catch { return false; } };

/** Below the main sections: learning, accesses, plan and settings, each only when this person may use it. */
const FOOT: Item[] = [
  { to: '/learn', label: 'cr.nav' }, { to: '/accesses', label: 'nav.accesses' },
  { to: '/plan', label: 'nav.plan' }, { to: '/settings', label: 'nav.settings' },
];

/**
 * Desktop navigation as a left sidebar (dashboard style). Client: the sections in NAV with their pages under the open one,
 * the count waiting for approval on Requests, and learning, accesses, plan and settings below. Admin: its own pages.
 * It folds to icons only, remembered per browser. Phones keep the bottom bar.
 */
export function Sidebar({ admin, items }: { admin: boolean; items: Item[] }) {
  const { t } = useI18n();
  const [slim, setSlimState] = useState(savedSlim);
  const setSlim = (v: boolean) => { setSlimState(v); try { localStorage.setItem(KEY, v ? 'slim' : 'wide'); } catch { /* private mode */ } };
  return (
    <aside className={`sbar${slim ? ' is-slim' : ''}`} aria-label={t('nav.sections')}>
      <div className="sbar-logo">
        <img src={slim ? '/brand/braindy-mark.svg' : '/brand/braindy-logo.svg'} alt="Braindy" />
        {admin && !slim && <span className="sbar-tag">admin</span>}
      </div>
      <nav className="sbar-main">{admin ? items.map((i) => <Link key={i.to} item={i} slim={slim} />) : <ClientSections slim={slim} />}</nav>
      <div className="sbar-foot">
        {!admin && <ClientFoot slim={slim} />}
        <button type="button" className="sbar-link" onClick={() => setSlim(!slim)} title={slim ? t('nav.expand') : undefined} aria-label={t(slim ? 'nav.expand' : 'nav.collapse')}>
          <span className="sbar-ico">{NAV_ICON[slim ? 'expand' : 'collapse']}</span>{!slim && <span>{t('nav.collapse')}</span>}
        </button>
      </div>
    </aside>
  );
}

function Link({ item, slim, on, badge, sub }: { item: Item; slim: boolean; on?: boolean; badge?: number; sub?: boolean }) {
  const { t } = useI18n();
  const label = t(item.label);
  return (
    <NavLink to={item.to} end={sub} data-tour={item.to === '/requests' ? 'ask-nav' : undefined} title={slim ? label : undefined} aria-label={slim ? label : undefined}
      className={({ isActive }) => `${sub ? 'sbar-sub' : 'sbar-link'}${on ?? isActive ? ' is-on' : ''}`}>
      {!sub && <span className="sbar-ico">{NAV_ICON[item.to] ?? NAV_ICON['/home']}{slim && badge ? <i className="sbar-dot" /> : null}</span>}
      {!slim && <span className="grow truncate">{label}</span>}
      {!slim && badge ? <span className="sbar-badge">{badge}</span> : null}
    </NavLink>
  );
}

function ClientSections({ slim }: { slim: boolean }) {
  const { can } = useMySections();
  const { pathname } = useLocation();
  const isAdmin = useAuth().profile?.role === 'admin';
  const filled = useFilled();
  const { current } = useBrands();
  const { list } = useRequests(can('requests') ? current?.id : undefined);
  const waiting = list.filter((r) => r.status === 'to_approve').length;
  return <>{NAV.map((g) => {
    const pages = g.pages.filter((p) => can(sectionOfPath(p.to)));
    if (!pages.length) return null;
    const on = g.pages.some((p) => pathname === p.to || pathname.startsWith(`${p.to}/`));
    // The group's pages open under it while you are in it; a page with nothing in it stays out for the client.
    const subs = on && !slim ? pages.filter((p) => isAdmin || pathname === p.to || filled(p.to)) : [];
    return (
      <div key={g.label} className="col">
        <Link item={{ to: pages[0]!.to, label: g.label }} slim={slim} on={on} badge={pages[0]!.to === '/requests' ? waiting : undefined} />
        {subs.length > 1 && <div className="sbar-subs">{subs.map((p) => <Link key={p.to} item={p} slim={slim} sub />)}</div>}
      </div>
    );
  })}</>;
}

function ClientFoot({ slim }: { slim: boolean }) {
  const { can } = useMySections();
  return <>{FOOT.filter((i) => can(sectionOfPath(i.to))).map((i) => <Link key={i.to} item={i} slim={slim} />)}</>;
}
