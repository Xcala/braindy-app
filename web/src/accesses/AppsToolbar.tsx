import type { StringKey } from '../i18n/strings';
import { useI18n } from '../i18n/I18nProvider';
import type { AppsView } from './appsView';

const SORTS: [AppsView['sort'], StringKey][] = [['manual', 'apps.sortManual'], ['az', 'apps.sortAz'], ['price', 'apps.sortPrice'], ['recent', 'apps.sortRecent']];
const GROUPS: [AppsView['groupBy'], StringKey][] = [['none', 'apps.groupNone'], ['group', 'apps.groupGroup'], ['signIn', 'apps.groupSignIn'], ['account', 'apps.groupAccount']];
const FILTERS: [AppsView['filter'], StringKey][] = [['all', 'apps.filterAll'], ['subs', 'apps.filterSubs'], ['direct', 'acc.payClient'], ['braindy', 'acc.payBraindy'], ['google', 'acc.signInGoogle'], ['microsoft', 'acc.signInMicrosoft'], ['missing', 'apps.filterMissing']];

const ListIcon = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
const GridIcon = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;

/** Search, sort, group, list or grid, and quick filters (with how many apps each one leaves). */
export function AppsToolbar({ view, set, q, setQ, counts }: {
  view: AppsView; set: (p: Partial<AppsView>) => void; q: string; setQ: (q: string) => void; counts: Record<AppsView['filter'], number>;
}) {
  const { t } = useI18n();
  return (
    <div className="col g12">
      <div className="apps-bar">
        <label className="apps-search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('apps.search')} aria-label={t('apps.search')}
            onKeyDown={(e) => e.key === 'Escape' && setQ('')} />
        </label>
        <label className="apps-select"><span className="label">{t('apps.sort')}</span>
          <select className="input" value={view.sort} onChange={(e) => set({ sort: e.target.value as AppsView['sort'] })}>
            {SORTS.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}
          </select></label>
        <label className="apps-select"><span className="label">{t('apps.groupBy')}</span>
          <select className="input" value={view.groupBy} onChange={(e) => set({ groupBy: e.target.value as AppsView['groupBy'] })}>
            {GROUPS.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}
          </select></label>
        <div className="apps-seg" role="radiogroup" aria-label={t('apps.view')}>
          {(['list', 'grid'] as const).map((l) => (
            <button key={l} type="button" role="radio" aria-checked={view.layout === l} title={t(l === 'list' ? 'apps.list' : 'apps.grid')}
              aria-label={t(l === 'list' ? 'apps.list' : 'apps.grid')} onClick={() => set({ layout: l })}>{l === 'list' ? ListIcon : GridIcon}</button>
          ))}
        </div>
      </div>
      <div className="row g8 wrap" role="group" aria-label={t('apps.filter')}>
        {FILTERS.filter(([f]) => f === 'all' || counts[f] > 0 || view.filter === f).map(([f, k]) => (
          <button key={f} type="button" aria-pressed={view.filter === f} onClick={() => set({ filter: f })}
            className={`btn btn-sm ${view.filter === f ? 'btn-primary' : 'btn-secondary'}`}>{t(k)} <span className="apps-n">{counts[f]}</span></button>
        ))}
      </div>
    </div>
  );
}
