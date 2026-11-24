import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router';
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
import { sectionOfPath, useMySections } from '../team/sections';
import { SubNav } from './SubNav';
import { HowItWorks } from '../learn/tutorials';
import { Sidebar } from './Sidebar';
import { DrawerScrim } from './PushDrawer';
import { useEffect, useRef } from 'react';
import { ADMIN_TABS, AdminBottomNav } from './AdminBottomNav';
import { HelpChat } from '../help/HelpChat';
import { IdeasPanel } from '../wishes/IdeasPanel';
import { AlertsInvite } from '../pwa/AlertsInvite';
import { AssistantIntro } from '../help/AssistantIntro';
import './shell.css';

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
  const adminSpace = isAdmin && pathname.startsWith('/admin');

  return (
    <BrandProvider>
      <Toaster>
      <div className="shell flex min-h-full">
      <Sidebar admin={adminSpace} items={ADMIN_TABS} />
      <div className="pd-app flex min-h-full min-w-0 flex-1 flex-col">
        <header ref={head} className="topbar shell-top" style={{ height: 'auto', minHeight: '3.5rem', flexWrap: 'nowrap', padding: '0.5rem 0.75rem', paddingTop: 'max(0.5rem, env(safe-area-inset-top))', gap: '0.5rem', position: 'sticky', top: 0 }}>
          <Link to={adminSpace ? '/admin/today' : '/home'} className="hidden sm:inline-flex md:hidden"><img className="logo" src="/brand/braindy-logo.svg" alt="Braindy" /></Link>
          <div className="vsep hidden sm:block md:hidden" style={{ height: '2rem', margin: 0 }} />
          {adminSpace ? (
            <>
              <Link to="/admin/today" className="ws" aria-label="Braindy admin" style={{ textDecoration: 'none' }}><span className="wsm"><img src="/brand/braindy-mark.svg" alt="" /></span><span className="hidden sm:inline">Braindy admin</span></Link>
              {/* Picking a brand enters it, on phones too: the way into the client view. */}
              <span className="min-w-0 shrink"><BrandMenu isAdmin enter onPicked={() => navigate('/home')} /></span>
            </>
          ) : (
            <>
              <span className="min-w-0 shrink"><BrandMenu isAdmin={isAdmin} /></span>
              {/* Phones: the way back to admin lives in the brand menu and the account menu, so the brand keeps the room (2026-11-21). */}
              {isAdmin && <span className="hidden shrink-0 sm:inline-flex"><Link to="/admin/today" className="btn btn-secondary btn-sm">{t('nav.backToAdmin')}</Link></span>}
            </>
          )}
          <div className="grow" />
          {isAdmin && import.meta.env.DEV && <span className="hidden md:inline-flex"><ApiStatus /></span>}
          <CommandK />
          <Notifications />
          <AccountMenu />
        </header>
        <div className="shell-card">
        <main className="mx-auto w-full max-w-[80rem] flex-1 px-4 pb-28 pt-8 sm:px-8 md:pb-16 lg:px-10">
          <SectionGate>{!adminSpace && <><SubNav /><HowItWorks /></>}<Outlet /></SectionGate>
        </main>
        {adminSpace ? <AdminBottomNav /> : <BottomNav />}
        </div>
        {!adminSpace && <><IdeasPanel /><HelpChat /><AssistantIntro /></>}
        <AlertsInvite />
        <DrawerScrim />
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
