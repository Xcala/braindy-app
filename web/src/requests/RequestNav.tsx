// Previous / next request from the detail page. Follows the order (and filters) of the list the person came from;
// if they arrived from a link, it walks the brand's open requests, newest first.
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useRequests } from './useRequests';

const key = (brandId: string) => `bd.reqOrder.${brandId}`;

/** Called by the list with what it shows, in that order. */
export function rememberOrder(brandId: string, ids: string[], query: string) {
  try { sessionStorage.setItem(key(brandId), JSON.stringify({ ids, query })); } catch { /* private window */ }
}

function remembered(brandId: string): { ids: string[]; query: string } | null {
  try { const v = JSON.parse(sessionStorage.getItem(key(brandId)) ?? 'null'); return Array.isArray(v?.ids) ? v : null; } catch { return null; }
}

export function RequestNav({ brandId, id }: { brandId: string; id: string }) {
  const { t } = useI18n();
  const { list } = useRequests(brandId);
  const saved = remembered(brandId);
  const ids = saved?.ids.includes(id) ? saved.ids : list.filter((r) => !r.archived).map((r) => r.id);
  const i = ids.indexOf(id);
  const prev = i > 0 ? ids[i - 1] : undefined;
  const next = i >= 0 && i < ids.length - 1 ? ids[i + 1] : undefined;
  const titleOf = (rid?: string) => list.find((r) => r.id === rid)?.title ?? '';

  if (i < 0 || ids.length < 2) return null;
  const btn = (to: string | undefined, dir: 'prev' | 'next') => {
    const label = `${t(`req.nav.${dir}`)}${to && titleOf(to) ? `: ${titleOf(to)}` : ''}`;
    const icon = <Icon name={dir === 'prev' ? 'chevronLeft' : 'chevronRight'} size={18} />;
    return to
      ? <Link to={`/requests/${to}`} className="btn btn-secondary btn-sm btn-icon req-nav-btn" aria-label={label} title={label}>{icon}</Link>
      : <span className="btn btn-secondary btn-sm btn-icon req-nav-btn is-off" aria-hidden="true">{icon}</span>;
  };
  return (
    <nav className="req-nav" aria-label={t('req.nav.label')}>
      {btn(prev, 'prev')}
      <span className="t-sm t-mute req-nav-count">{t('req.nav.count', { n: i + 1, total: ids.length })}</span>
      {btn(next, 'next')}
    </nav>
  );
}
