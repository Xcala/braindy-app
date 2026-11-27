import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { logoDomain } from './AppLogo';
import { AccessRow, COL_LABEL, filledCols, gridFor, priceLabel, type AccessCol } from './AccessRow';
import { AccessCard } from './AccessCard';
import { groupApps, groupKey, matches, monthlyTotals, passes, sortApps, type AppsView } from './appsView';
import { useDragOrder } from './useDragOrder';
import { accessesApi, type Access } from './useAccesses';
import './apps.css';

const money = (list: Access[], t: ReturnType<typeof useI18n>['t'], lang: string) =>
  [...monthlyTotals(list)].map(([cur, v]) => priceLabel(Math.round(v * 100) / 100, cur, 'month', t, lang)).join(' + ');

/** The apps as a table or a grid, searched, filtered, sorted and grouped; drag to reorder in «My order». */
export function AppsList({ brandId, list, view, q, cols: picked, onEdit, onClear }: {
  brandId: string; list: Access[]; view: AppsView; q: string; cols: AccessCol[]; onEdit: (a: Access) => void; onClear: () => void;
}) {
  const { t, lang } = useI18n();
  const cols = filledCols(picked, list);
  // The dragged order shows at once; the live list replaces it when the save comes back.
  const [local, setLocal] = useState<{ ids: string[]; groups: Record<string, string> } | null>(null);
  useEffect(() => setLocal(null), [list]);
  const ordered = useMemo(() => {
    if (!local) return list;
    const at = new Map(local.ids.map((id, i) => [id, i]));
    return list.map((a) => ({ ...a, order: at.get(a.id) ?? a.order, group: local.groups[a.id] ?? a.group }));
  }, [list, local]);

  const shown = sortApps(ordered.filter((a) => passes(a, view.filter) && (!q.trim() || matches(a, q))), view.sort);
  const groups = groupApps(shown, view.groupBy, t);
  const canDrag = view.sort === 'manual' && view.filter === 'all' && !q.trim() && view.groupBy !== 'signIn' && view.groupBy !== 'account';
  const flat = groups.flatMap((g) => g.items.map((a) => ({ a, group: view.groupBy === 'group' ? groupKey(a, 'group') : null })));
  const drag = useDragOrder(flat, canDrag, (ids, moved) => {
    setLocal({ ids, groups: moved });
    accessesApi.reorder(brandId, ids, moved).catch(() => setLocal(null));
  });

  if (shown.length === 0 && list.length > 0) {
    return <div className="card row between g12 wrap"><span className="t-mute">{t('apps.noMatch')}</span><button type="button" className="btn btn-secondary btn-sm" onClick={onClear}>{t('apps.clear')}</button></div>;
  }

  const head = (g: (typeof groups)[number]) => g.label && (
    <div className="apps-ghead">
      <span className="w7">{g.label}</span>
      <span className="t-xs t-mute">{g.items.length === 1 ? t('apps.countOne') : t('apps.count', { n: String(g.items.length) })}{monthlyTotals(g.items).size ? ` · ${money(g.items, t, lang)}` : ''}</span>
    </div>
  );

  return (
    <div className="col g16">
      {groups.map((g) => view.layout === 'grid' ? (
        <section key={g.key} className="col g12">
          {head(g)}
          <div className="apps-grid">
            {g.items.map((a) => <AccessCard key={a.id} brandId={brandId} a={a} logo={logoDomain(a, list)} drag={drag(a)} onEdit={() => onEdit(a)} />)}
          </div>
        </section>
      ) : (
        <section key={g.key} className="col g8">
          {head(g)}
          <div className="table acc-table overflow-x-auto">
            <div className="trow head label" style={{ gridTemplateColumns: gridFor(cols), minWidth: `${(260 + cols.length * 170) / 16}rem` }}>
              <span>{t('acc.platform')}</span>{cols.map((c) => <span key={c}>{t(COL_LABEL[c])}</span>)}<span />
            </div>
            {g.items.map((a) => <AccessRow key={a.id} brandId={brandId} a={a} cols={cols} logo={logoDomain(a, list)} drag={drag(a)} onEdit={() => onEdit(a)} />)}
          </div>
        </section>
      ))}
      <p className="t-xs t-mute">{t(canDrag ? 'apps.dragHint' : 'apps.dragOff')}</p>
    </div>
  );
}
