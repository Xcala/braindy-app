import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';
import { Toaster } from '../components/Toaster';
import { requestTour } from '../tour/useTour';
import { useAuth } from '../auth/AuthProvider';
import { ApiStatus } from '../components/ApiStatus';
import { BrandProvider } from '../brands/BrandProvider';
import { BrandMenu } from '../brands/BrandMenu';
import { LangToggle } from '../i18n/LangToggle';
import { CommandK } from '../components/CommandK';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';

const TABS: Array<{ to: string; label: StringKey }> = [
  { to: '/home', label: 'nav.home' },
  { to: '/brand', label: 'nav.brand' },
  { to: '/ask', label: 'nav.ask' },
  { to: '/requests', label: 'nav.requests' },
  { to: '/assets', label: 'nav.assets' },
  { to: '/report', label: 'nav.report' },
  { to: '/learn', label: 'cr.nav' },
  { to: '/accesses', label: 'nav.accesses' },
];
const ADMIN_TABS: Array<{ to: string; label: StringKey }> = [
  { to: '/admin/today', label: 'today.title' },
  { to: '/admin/studio', label: 'st.nav' },
  { to: '/admin/brands', label: 'nav.brands' },
  { to: '/admin/proposals', label: 'nav.proposals' },
  { to: '/admin/onboarding', label: 'nav.onboarding' },
  { to: '/admin/billing', label: 'nav.billing' },
  { to: '/team', label: 'nav.team' },
  { to: '/admin/criterio', label: 'cra.nav' },
];

export function AppShell() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const isAdmin = profile?.role === 'admin';
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Admin is its own space (design 24): never mixed with the client tabs.
  const adminSpace = isAdmin && (pathname.startsWith('/admin') || pathname === '/team');

  return (
    <BrandProvider>
      <Toaster>
      <div className="flex min-h-full flex-col">
        <header className="topbar" style={{ height: 'auto', minHeight: 56, flexWrap: 'nowrap', padding: '8px 12px', gap: 8 }}>
          <span className="hidden sm:inline-flex"><img className="logo" src="/brand/braindy-logo.svg" alt="Braindy" /></span>
          <div className="vsep hidden sm:block" style={{ height: 32, margin: 0 }} />
          {adminSpace ? (
            <>
              <Link to="/admin/today" className="ws" style={{ textDecoration: 'none' }}><span className="wsm"><img src="/brand/braindy-mark.svg" alt="" /></span>Braindy admin</Link>
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
          <LangToggle />
          <AccountMenu />
        </header>
        <div className={adminSpace ? '' : 'hidden md:block'}>
        <nav className="tabs overflow-x-auto" aria-label={t('nav.sections')} style={{ paddingLeft: 16, paddingRight: 16 }}>
          {(adminSpace ? ADMIN_TABS : TABS).map((tab) => <Tab key={tab.to} to={tab.to} label={t(tab.label)} admin={adminSpace} />)}
        </nav>
        </div>
        <main className={`mx-auto w-full max-w-[1280px] flex-1 px-4 pt-8 sm:px-8 lg:px-10 ${adminSpace ? 'pb-16' : 'pb-28 md:pb-16'}`}>
          <Outlet />
        </main>
        {!adminSpace && <BottomNav />}
      </div>
      </Toaster>
    </BrandProvider>
  );
}

function Tab({ to, label, admin }: { to: string; label: string; admin?: boolean }) {
  return (
    <NavLink to={to} data-tour={to === '/ask' ? 'ask-nav' : undefined} className={({ isActive }) => `tab ${admin ? 'tab-admin' : ''} ${isActive ? 'is-active' : ''}`}>
      {label}
    </NavLink>
  );
}

function AccountMenu() {
  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const name = profile?.name ?? user?.email ?? '';
  const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={t('nav.account')}
        className="row g12" style={{ appearance: 'none', border: 0, background: 'none', cursor: 'pointer', padding: 2, borderRadius: 999 }}>
        {user?.photoURL ? <img className="avatar" src={user.photoURL} alt="" /> : <span className="avatar-txt">{initials}</span>}
        <span className="hidden flex-col items-start md:flex" style={{ lineHeight: '16px' }}>
          <span className="w7" style={{ fontSize: 14, color: 'var(--ink)' }}>{profile?.name?.split(' ')[0] ?? name}</span>
          <span className="t-xs t-mute">{profile?.role === 'admin' ? t('role.admin') : t('role.client')}</span>
        </span>
      </button>
      {open && (
        <div className="menu absolute right-0 top-[52px] z-40 w-60" role="menu">
          <p className="t-sm t-mute truncate" style={{ padding: '8px 12px' }}>{user?.email}</p>
          <div className="md:hidden">
            {([['/report', 'nav.report'], ['/learn', 'cr.nav'], ['/accesses', 'nav.accesses']] as Array<[string, StringKey]>).map(([to, k]) => (
              <NavLink key={to} role="menuitem" to={to} onClick={() => setOpen(false)} className="menu-item" style={{ textDecoration: 'none', color: 'var(--ink)' }}>{t(k)}</NavLink>
            ))}
          </div>
          {profile?.role === 'admin' && <div className="sm:hidden"><NavLink role="menuitem" to="/admin/today" onClick={() => setOpen(false)} className="menu-item" style={{ textDecoration: "none", color: "var(--ink)" }}>{t("nav.backToAdmin")}</NavLink></div>}
          <button role="menuitem" className="menu-item w-full text-left" style={{ border: 0, background: 'none', cursor: 'pointer' }}
            onClick={() => { setOpen(false); if (!requestTour()) navigate('/home?tour=1'); }}>{t('tour.see')}</button>
          <NavLink role="menuitem" to="/settings" onClick={() => setOpen(false)} className="menu-item" style={{ textDecoration: "none", color: "var(--ink)" }}>{t("nav.settings")}</NavLink>
          <button role="menuitem" onClick={logout} className="menu-item w-full text-left" style={{ border: 0, background: 'none', cursor: 'pointer' }}>
            {t('common.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
