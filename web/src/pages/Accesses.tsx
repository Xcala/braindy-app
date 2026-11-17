import { useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { ALL_COLS, priceLabel, type AccessCol } from '../accesses/AccessRow';
import { AppsList } from '../accesses/AppsList';
import { AppsToolbar } from '../accesses/AppsToolbar';
import { loadView, monthlyTotals, passes, saveView, type AppsView } from '../accesses/appsView';
import { AccessForm } from '../accesses/AccessForm';
import { useAccessLog, useAccesses, type Access } from '../accesses/useAccesses';
import { BackToAccount } from './Account';
import { Scan } from '../components/Scan';

/** Third party apps (design 07; since 2026-11-17 folded inside Mi plan › Hosting and access, `embedded`): encrypted credentials, reveal on demand, search, groups, grid, read-only log. */
export function Accesses({ embedded = false }: { embedded?: boolean }) {
  const { current } = useBrands();
  const { t, lang } = useI18n();
  const { list, loading, denied } = useAccesses(current?.id);
  const log = useAccessLog(denied ? undefined : current?.id);
  const [editing, setEditing] = useState<Access | null | 'new'>(null);
  const [cols, setCols] = useState<AccessCol[]>(loadCols);
  const toggle = (c: AccessCol) => setCols((now) => { const next = now.includes(c) ? now.filter((x) => x !== c) : ALL_COLS.filter((x) => x === c || now.includes(x)); saveCols(next); return next; });
  const [view, setView] = useState<AppsView>(loadView);
  const set = (p: Partial<AppsView>) => setView((v) => { const next = { ...v, ...p }; saveView(next); return next; });
  const [q, setQ] = useState('');
  const FILTERS: AppsView['filter'][] = ['all', 'subs', 'google', 'microsoft', 'missing'];
  const counts = Object.fromEntries(FILTERS.map((f) => [f, list.filter((a) => passes(a, f)).length])) as Record<AppsView['filter'], number>;
  const groupNames = [...new Set(list.map((a) => a.group).filter((g): g is string => !!g))].sort();
  const label: Record<AccessCol, string> = { user: t('acc.user'), password: t('acc.password'), link: t('acc.link'), plan: t('acc.subscription'), notes: t('acc.notes') };
  const monthly = monthlyTotals(list);
  const subs = list.filter((a) => a.subscription).length;
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  const when = (d?: Date) => {
    if (!d) return '';
    const today = new Date().toDateString() === d.toDateString();
    return today ? d.toLocaleTimeString(lang === 'es' ? 'es-CO' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="col g32">
      {!embedded && <BackToAccount />}
      <div className="row between g16 wrap">
        <div className="col g8">
          {!embedded && <p className="label">{current.name}</p>}
          {!embedded && <h1 className="h1">{t('nav.accesses')}</h1>}
          <p className="t-mute" style={{ margin: 0 }}>{t('acc.tagline')}</p>
        </div>
        {!denied && <button className="btn btn-primary" onClick={() => setEditing('new')}>{t('acc.addAccess')}</button>}
      </div>

      {denied ? <div className="card t-mute">{t('acc.ownersOnly')}</div> : (
        <div className="col g24">
          <div className="col g12 min-w-0">
          <AppsToolbar view={view} set={set} q={q} setQ={setQ} counts={counts} />
          {view.layout === 'list' && <div className="row g8 wrap" role="group" aria-label={t('acc.columns')}>
            <span className="label">{t('acc.columns')}</span>
            {ALL_COLS.map((c) => (
              <button key={c} type="button" aria-pressed={cols.includes(c)} onClick={() => toggle(c)} className={`btn btn-sm ${cols.includes(c) ? 'btn-primary' : 'btn-secondary'}`}>{cols.includes(c) ? '✓ ' : ''}{label[c]}</button>
            ))}
          </div>}
          {loading ? <p className="t-sm t-mute">{t('common.loading')}…</p> : list.length === 0 ? <div className="card t-mute">{t('acc.empty')}</div>
            : <AppsList brandId={current.id} list={list} view={view} q={q} cols={cols} onEdit={setEditing} onClear={() => { setQ(''); set({ filter: 'all' }); }} />}
          {subs > 0 && (
            <p className="t-sm" style={{ margin: 0 }}>
              <span className="w7">{t('acc.subsTotal', { n: String(subs) })}</span>
              {monthly.size > 0 && <span className="t-mute"> · {[...monthly].map(([cur, v]) => priceLabel(Math.round(v * 100) / 100, cur, 'month', t, lang)).join(' + ')}</span>}
            </p>
          )}
          <p className="t-xs t-mute">{t('acc.revealNote')}</p>
          </div>
          <aside className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
            <div className="card col g12">
              <h2 className="h3">{t('acc.log')}</h2>
              {log.length === 0 && <p className="t-sm t-mute">{t('acc.logEmpty')}</p>}
              {log.map((e) => (
                <div key={e.id} className="row between g8 t-sm">
                  <span className="truncate"><span className="w7">{e.byName}</span> {t(`acc.action.${e.action}`)} {e.platform}</span>
                  <span className="t-xs t-mute whitespace-nowrap">{when(e.at?.toDate())}</span>
                </div>
              ))}
              <p className="t-xs t-mute">{t('acc.logNote')}</p>
            </div>
            <div className="card col g8">
              <h2 className="h3">{t('acc.howTitle')}</h2>
              <Scan text={t('acc.howBody')} />
            </div>
          </aside>
        </div>
      )}
      {editing && <AccessForm brandId={current.id} editing={editing === 'new' ? null : editing} groups={groupNames} onClose={() => setEditing(null)} />}
    </div>
  );
}

// v2: the subscription column joined the defaults (2026-11-02).
const COLS_KEY = 'acc-cols-2';
/** Visible columns, remembered in this browser. Default: user, password, link and subscription. */
function loadCols(): AccessCol[] {
  try { const v = JSON.parse(localStorage.getItem(COLS_KEY) ?? 'null'); if (Array.isArray(v)) return ALL_COLS.filter((c) => v.includes(c)); } catch { /* storage blocked */ }
  return ['user', 'password', 'link', 'plan'];
}
function saveCols(cols: AccessCol[]) { try { localStorage.setItem(COLS_KEY, JSON.stringify(cols)); } catch { /* storage blocked */ } }
