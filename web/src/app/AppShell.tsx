import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { Wordmark } from '../components/Wordmark';
import { ApiStatus } from '../components/ApiStatus';
import { BrandProvider } from '../brands/BrandProvider';
import { BrandSwitcher } from '../brands/BrandSwitcher';
import { LangToggle } from '../i18n/LangToggle';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';

const TABS: Array<{ to: string; label: StringKey }> = [
  { to: '/brand', label: 'nav.brand' },
  { to: '/assets', label: 'nav.assets' },
  { to: '/ask', label: 'nav.ask' },
  { to: '/requests', label: 'nav.requests' },
  { to: '/accesses', label: 'nav.accesses' },
];
const ADMIN_TABS: Array<{ to: string; label: StringKey }> = [
  { to: '/admin/brands', label: 'nav.brands' },
  { to: '/team', label: 'nav.team' },
];

export function AppShell() {
  const { profile, logout } = useAuth();
  const { t } = useI18n();
  const isAdmin = profile?.role === 'admin';
  const tabs = isAdmin ? [...TABS, ...ADMIN_TABS] : TABS;

  return (
    <BrandProvider>
      <div className="flex min-h-full flex-col">
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-4">
              <Wordmark className="text-2xl" />
              <BrandSwitcher />
            </div>
            <div className="flex items-center gap-3 text-sm">
              {isAdmin && <ApiStatus />}
              <LangToggle />
              <span className="hidden text-black/60 md:inline">{profile?.name ?? profile?.email}</span>
              <button onClick={logout} className="rounded-full border border-black/15 px-3 py-1 hover:bg-black/5">
                {t('common.signOut')}
              </button>
            </div>
          </div>
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `whitespace-nowrap border-b-2 px-3 py-2 text-sm ${
                    isActive ? 'border-ink font-medium' : 'border-transparent text-black/55 hover:text-ink'
                  }`
                }
              >
                {t(tab.label)}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          <Outlet />
        </main>
      </div>
    </BrandProvider>
  );
}
