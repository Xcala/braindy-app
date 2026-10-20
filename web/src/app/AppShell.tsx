import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router';
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
  { to: '/assets', label: 'nav.assets' },
  { to: '/ask', label: 'nav.ask' },
  { to: '/requests', label: 'nav.requests' },
  { to: '/accesses', label: 'nav.accesses' },
];
const ADMIN_TABS: Array<{ to: string; label: StringKey }> = [
  { to: '/admin/brands', label: 'nav.brands' },
  { to: '/admin/proposals', label: 'nav.proposals' },
  { to: '/team', label: 'nav.team' },
];

export function AppShell() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const isAdmin = profile?.role === 'admin';

  return (
    <BrandProvider>
      <div className="flex min-h-full flex-col">
        <header className="topbar" style={{ height: 'auto', minHeight: 72, flexWrap: 'wrap', padding: '12px 16px', rowGap: 12 }}>
          <img className="logo" src="/brand/braindy-logo.svg" alt="Braindy" />
          <div className="vsep hidden sm:block" style={{ height: 32, margin: 0 }} />
          <BrandMenu isAdmin={isAdmin} />
          <div className="grow" />
          {isAdmin && <span className="hidden md:inline-flex"><ApiStatus /></span>}
          <CommandK />
          <LangToggle />
          <AccountMenu />
        </header>
        <nav className="tabs overflow-x-auto" aria-label={t('nav.sections')} style={{ paddingLeft: 16, paddingRight: 16 }}>
          {TABS.map((tab) => <Tab key={tab.to} to={tab.to} label={t(tab.label)} />)}
          {isAdmin && (
            <>
              <span className="vsep" />
              {ADMIN_TABS.map((tab) => <Tab key={tab.to} to={tab.to} label={t(tab.label)} admin />)}
            </>
          )}
        </nav>
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-16 pt-8 sm:px-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </BrandProvider>
  );
}

function Tab({ to, label, admin }: { to: string; label: string; admin?: boolean }) {
  return (
    <NavLink to={to} className={({ isActive }) => `tab ${admin ? 'tab-admin' : ''} ${isActive ? 'is-active' : ''}`}>
      {label}
    </NavLink>
  );
}

function AccountMenu() {
  const { profile, user, logout } = useAuth();
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
          <NavLink role="menuitem" to="/settings" onClick={() => setOpen(false)} className="menu-item" style={{ textDecoration: "none", color: "var(--ink)" }}>{t("nav.settings")}</NavLink>
          <button role="menuitem" onClick={logout} className="menu-item w-full text-left" style={{ border: 0, background: 'none', cursor: 'pointer' }}>
            {t('common.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
