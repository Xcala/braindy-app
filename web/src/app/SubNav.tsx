import { NavLink, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useBrandLinks } from '../links/useBrandLinks';
import { useHasSocial } from '../calendar/useSocialPosts';
import { useLegacyAssets } from '../assets/useLegacyAssets';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { sectionOfPath, useMySections } from '../team/sections';
import { groupOfPath } from './navGroups';

/** Phones only (the desktop sidebar lists them). Inside My brand and Deliveries: a small switch between its pages. A page with nothing in it stays out for the client. */
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
    <div className="flex md:hidden" style={{ marginBottom: 24 }}><nav className="seg seg-scroll" aria-label={t(group!.label)}>
      {pages.map((p) => <NavLink key={p.to} to={p.to} end className={({ isActive }) => (isActive ? 'is-on' : '')}>{t(p.label)}</NavLink>)}
    </nav></div>
  );
}

/** Whether a page has content: research needs studies or market maps, apps an app, the visual identity logos, colors, type
 *  or concept images, documents a pinned file, the calendar a social post. The rest always count. */
export function useFilled() {
  const brandId = useBrands().current?.id;
  const apps = useBrandLinks(brandId, 'apps');
  const research = useBrandLinks(brandId, 'research');
  const legacy = useLegacyAssets(brandId);
  const social = useHasSocial(brandId);
  const maps = legacy.some((a) => a.type === 'marketmap');
  const id = (useBrandDoc(brandId, 'context/identity').data ?? {}) as Record<string, unknown[] | object | undefined>;
  const has = (k: string) => Array.isArray(id[k]) ? (id[k] as unknown[]).length > 0 : !!id[k];
  const visual = has('logos') || has('colors') || has('typography') || has('concept') || legacy.some((a) => a.type === 'logodeck');
  return (to: string) => (to === '/apps' ? apps.links.length > 0 : to === '/calendar' ? social : to === '/research' ? research.links.length > 0 || maps
    : to === '/brand/visual' ? visual : to === '/brand/docs' ? has('documents') : true);
}
