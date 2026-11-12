import { Link, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useBrandLinks } from '../links/useBrandLinks';
import { useHasSocial } from '../calendar/useSocialPosts';
import { useLegacyAssets } from '../assets/useLegacyAssets';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { sectionOfPath, useMySections } from '../team/sections';
import { groupOfPath, pageMatch, type NavPage } from './navGroups';

/**
 * The tabs of a section, at the top of each of its pages (phones and desktop): My brand → Brand kit · Deliveries · Library ·
 * Sites and apps · Strategy; Results → Stats · Social calendar. A tab that groups several pages (Strategy) shows a second, smaller
 * switch. A page with nothing in it stays out for the client.
 */
export function SubNav() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const { can } = useMySections();
  const isAdmin = useAuth().profile?.role === 'admin';
  const filled = useFilled();
  const group = groupOfPath(pathname);
  const pages = (group?.pages ?? []).filter((p) => can(sectionOfPath(p.to)) && (isAdmin || pageMatch(pathname, p.to) || filled(p.to)));
  const here = pages.find((p) => pageMatch(pathname, p.to));
  const tabs = pages.filter((p, i) => !p.tab || pages.findIndex((q) => q.tab === p.tab) === i);
  const inTab = here?.tab ? pages.filter((p) => p.tab === here.tab) : [];
  if (tabs.length < 2 && inTab.length < 2) return null;
  const on = (p: NavPage) => (p.tab ? here?.tab === p.tab : here?.to === p.to);
  return (
    <div className="col g8" style={{ marginBottom: '1.5rem' }}>
      {tabs.length > 1 && <nav className="seg seg-scroll" aria-label={t(group!.label)}>
        {tabs.map((p) => <Link key={p.to} to={p.to} className={on(p) ? 'is-on' : ''} aria-current={on(p) ? 'page' : undefined}>{t(p.tab ?? p.label)}</Link>)}
      </nav>}
      {inTab.length > 1 && <nav className="seg seg-scroll seg-sm" aria-label={t(here!.tab!)}>
        {inTab.map((p) => <Link key={p.to} to={p.to} className={here?.to === p.to ? 'is-on' : ''} aria-current={here?.to === p.to ? 'page' : undefined}>{t(p.label)}</Link>)}
      </nav>}
    </div>
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
