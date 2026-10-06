import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { Wordmark } from '../components/Wordmark';
import { ApiStatus } from '../components/ApiStatus';

const TABS = [
  { to: '/brand', label: 'My brand' },
  { to: '/assets', label: 'My assets' },
  { to: '/ask', label: 'Ask for something' },
  { to: '/requests', label: 'My requests' },
  { to: '/accesses', label: 'Accesses' },
];

export function AppShell() {
  const { profile, logout } = useAuth();
  const tabs = profile?.role === 'admin' ? [...TABS, { to: '/team', label: 'Team' }] : TABS;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Wordmark className="text-2xl" />
          <div className="flex items-center gap-3 text-sm">
            {profile?.role === 'admin' && <ApiStatus />}
            <span className="hidden text-black/60 sm:inline">{profile?.name ?? profile?.email}</span>
            <button onClick={logout} className="rounded-full border border-black/15 px-3 py-1 hover:bg-black/5">
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 px-3 py-2 text-sm ${
                  isActive ? 'border-ink font-medium' : 'border-transparent text-black/55 hover:text-ink'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
