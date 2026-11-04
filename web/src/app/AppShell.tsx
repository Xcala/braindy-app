import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';
import { Toaster } from '../components/Toaster';
import { useAuth } from '../auth/AuthProvider';
import { ApiStatus } from '../components/ApiStatus';
import { BrandProvider } from '../brands/BrandProvider';
import { BrandMenu } from '../brands/BrandMenu';
import { CommandK } from '../components/CommandK';
import { Notifications } from '../components/Notifications';
import { AccountMenu } from './AccountSheet';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { sectionOfPath, useMySections } from '../team/sections';
import { SubNav } from './SubNav';
import { Sidebar } from './Sidebar';
import { useEffect, useRef } from 'react';

const ADMIN_TABS: Array<{ to: string; label: StringKey }> = [
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

export function AppShell() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const isAdmin = profile?.role === 'admin';
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // The top bar stays fixed while scrolling; its height goes to --top-h so the page's own sticky bars sit just under it.
  const head = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = head.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--top-h', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Admin is its own space (design 24): never mixed with the client tabs.
  const adminSpace = isAdmin && (pathname.startsWith('/admin') || pathname === '/team');

  return (
    <BrandProvider>
      <Toaster>
      <div className="flex min-h-full">
      <Sidebar admin={adminSpace} items={ADMIN_TABS} />
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header ref={head} className="topbar" style={{ height: 'auto', minHeight: 56, flexWrap: 'nowrap', padding: '8px 12px', paddingTop: 'max(8px, env(safe-area-inset-top))', gap: 8, position: 'sticky', top: 0 }}>
          <span className="hidden sm:inline-flex md:hidden"><img className="logo" src="/brand/braindy-logo.svg" alt="Braindy" /></span>
          <div className="vsep hidden sm:block md:hidden" style={{ height: 32, margin: 0 }} />
          {adminSpace ? (
            <>
              <Link to="/admin/today" className="ws" aria-label="Braindy admin" style={{ textDecoration: 'none' }}><span className="wsm"><img src="/brand/braindy-mark.svg" alt="" /></span><span className="hidden sm:inline">Braindy admin</span></Link>
              <span className="hidden sm:inline-flex"><BrandMenu isAdmin onPicked={() => navigate('/home')} /></span>
            </>
          ) : (
            <>
              <span className="min-w-0 shrink"><BrandMenu isAdmin={isAdmin} /></span>
              {isAdmin && <span className="hidden sm:inline-flex"><Link to="/admin/today" className="btn btn-secondary btn-sm">{t('nav.backToAdmin')}</Link></span>}
            </>
          )}
          <div className="grow" />
          {isAdmin && import.meta.env.DEV && <span className="hidden md:inline-flex"><ApiStatus /></span>}
          <CommandK />
          <Notifications />
          <AccountMenu />
        </header>
        {/* Admin on a phone: its pages as tabs (the client has the bottom bar; desktop has the sidebar). */}
        {adminSpace && (
          <div className="md:hidden"><nav className="tabs overflow-x-auto" aria-label={t('nav.sections')} style={{ paddingLeft: 16, paddingRight: 16 }}>
            {ADMIN_TABS.map((tab) => <Tab key={tab.to} to={tab.to} label={t(tab.label)} admin />)}
          </nav></div>
        )}
        <main className={`mx-auto w-full max-w-[1280px] flex-1 px-4 pt-8 sm:px-8 lg:px-10 ${adminSpace ? 'pb-16' : 'pb-28 md:pb-16'}`}>
          <SectionGate>{!adminSpace && <SubNav />}<Outlet /></SectionGate>
        </main>
        {!adminSpace && <BottomNav />}
      </div>
      </div>
      </Toaster>
    </BrandProvider>
  );
}

/** A closed section sends the person back home (the rules and the API block its data anyway). */
function SectionGate({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { ready, can } = useMySections();
  if (ready && !can(sectionOfPath(pathname))) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

function Tab({ to, label, admin, on }: { to: string; label: string; admin?: boolean; on?: boolean }) {
  return (
    <NavLink to={to} data-tour={to === '/requests' ? 'ask-nav' : undefined} className={({ isActive }) => `tab ${admin ? 'tab-admin' : ''} ${on ?? isActive ? 'is-active' : ''}`}>
      {label}
    </NavLink>
  );
}
