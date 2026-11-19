import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { useRequests } from '../requests/useRequests';
import { useBrainPulse } from '../brain/useBrainEvents';
import { sectionOfPath, useMySections } from '../team/sections';
import { FOOT_NAV, groupOfPath, NAV, type NavGroup } from './navGroups';
import { NAV_ICON } from './navIcons';
import { useFilled } from './SubNav';
import './sidebar.css';

type Item = { to: string; label: StringKey };
const KEY = 'braindy.sidebar';
const savedSlim = () => { try { return localStorage.getItem(KEY) === 'slim'; } catch { return false; } };


/**
 * Desktop navigation as a left sidebar (dashboard style). Client: one row per section (Home, Requests with the count waiting
 * for approval, My brand, Results) and, below, Learn · Wishlist · Account; each section's pages are tabs on the page. Admin: its own pages.
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
        {!admin && (
          <button type="button" className="sbar-link sbar-ai" onClick={() => window.dispatchEvent(new Event('bd-help-toggle'))} title={slim ? t('help.dock') : undefined} aria-label={t('help.dock')}>
            <span className="sbar-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4zM15 8.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" /></svg></span>{!slim && <span>{t('help.dock')}</span>}
          </button>
        )}
        <button type="button" className="sbar-link" onClick={() => setSlim(!slim)} title={slim ? t('nav.expand') : undefined} aria-label={t(slim ? 'nav.expand' : 'nav.collapse')}>
          <span className="sbar-ico">{NAV_ICON[slim ? 'expand' : 'collapse']}</span>{!slim && <span>{t('nav.collapse')}</span>}
        </button>
      </div>
    </aside>
  );
}

function Link({ item, slim, on, badge, sub, pulse, icon }: { item: Item; slim: boolean; on?: boolean; badge?: number; sub?: boolean; pulse?: boolean; icon?: string }) {
  const { t } = useI18n();
  const label = t(item.label);
  return (
    <NavLink to={item.to} end={sub} data-tour={item.to === '/requests' ? 'ask-nav' : undefined} title={slim ? label : undefined} aria-label={slim ? label : undefined}
      className={({ isActive }) => `${sub ? 'sbar-sub' : 'sbar-link'}${on ?? isActive ? ' is-on' : ''}`}>
      {!sub && <span className="sbar-ico">{NAV_ICON[icon ?? item.to] ?? NAV_ICON['/home']}{slim && badge ? <i className="sbar-dot" /> : null}{pulse ? <i className="sbar-pulse" aria-hidden="true" /> : null}</span>}
      {!slim && <span className="grow truncate">{label}</span>}
      {!slim && badge ? <span className="sbar-badge">{badge}</span> : null}
    </NavLink>
  );
}

function ClientSections({ slim }: { slim: boolean }) {
  const { can } = useMySections();
  const { current } = useBrands();
  const { list } = useRequests(can('requests') ? current?.id : undefined);
  const waiting = list.filter((r) => r.status === 'to_approve').length;
  // When the Brain learns something new (an approval, a file, Mi marca…), My brand pulses for a moment.
  const learned = useBrainPulse(can('brand') && current?.kind === 'brand' ? current.id : undefined);
  return <Groups groups={NAV} slim={slim} waiting={waiting} learned={learned} />;
}

/** One row per section; it lights on any of its pages and opens the first one this person may use (and has something in it). */
function Groups({ groups, slim, waiting, learned }: { groups: NavGroup[]; slim: boolean; waiting?: number; learned?: boolean }) {
  const { can } = useMySections();
  const { pathname } = useLocation();
  const isAdmin = useAuth().profile?.role === 'admin';
  const filled = useFilled();
  return <>{groups.map((g) => {
    const pages = g.pages.filter((p) => can(sectionOfPath(p.to)));
    if (!pages.length) return null;
    const on = groupOfPath(pathname) === g;
    // One row per section (2026-11-12): its pages are tabs at the top of the page (SubNav). It opens the first page with something in it.
    const first = pages.find((p) => isAdmin || filled(p.to)) ?? pages[0]!;
    return (
      <div key={g.label} className="col">
        <Link item={{ to: first.to, label: g.label }} icon={NAV_ICON[g.label] ? g.label : g.pages[0]!.to} slim={slim} on={on} badge={first.to === '/requests' ? waiting : undefined} pulse={g.label === 'nav.brand' && learned} />
      </div>
    );
  })}</>;
}

function ClientFoot({ slim }: { slim: boolean }) {
  return <Groups groups={FOOT_NAV} slim={slim} />;
}
