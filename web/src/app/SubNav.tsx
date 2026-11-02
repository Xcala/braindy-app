import { NavLink, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useBrandLinks } from '../links/useBrandLinks';
import { useLegacyAssets } from '../assets/useLegacyAssets';
import { useI18n } from '../i18n/I18nProvider';
import { sectionOfPath, useMySections } from '../team/sections';
import { groupOfPath } from './navGroups';

/** Inside My brand and Deliveries: a small switch between its pages. A page with nothing in it stays out for the client. */
export function SubNav() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const { can } = useMySections();
  const isAdmin = useAuth().profile?.role === 'admin';
  const filled = useFilled();
  const group = groupOfPath(pathname);
  const pages = (group?.pages ?? []).filter((p) => can(sectionOfPath(p.to)) && (isAdmin || pathname === p.to || filled(p.to)));
  if (pages.length < 2) return null;
  return (
    <div style={{ marginBottom: 24, display: 'flex' }}><nav className="seg seg-scroll" aria-label={t(group!.label)}>
      {pages.map((p) => <NavLink key={p.to} to={p.to} className={({ isActive }) => (isActive ? 'is-on' : '')}>{t(p.label)}</NavLink>)}
    </nav></div>
  );
}

/** Whether a page has content: research needs studies or market maps, apps need at least one app. The rest always count. */
function useFilled() {
  const brandId = useBrands().current?.id;
  const apps = useBrandLinks(brandId, 'apps');
  const research = useBrandLinks(brandId, 'research');
  const maps = useLegacyAssets(brandId).some((a) => a.type === 'marketmap');
  return (to: string) => (to === '/apps' ? apps.links.length > 0 : to === '/research' ? research.links.length > 0 || maps : true);
}
