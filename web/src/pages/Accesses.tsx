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
  const FILTERS: AppsView['filter'][] = ['all', 'subs', 'direct', 'braindy', 'google', 'microsoft', 'missing'];
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
          {embedded && <h1 className="h1">{t('plan.stackTitle')}</h1>}
          <p className="t-mute" style={{ margin: 0, maxWidth: '40rem' }}>{embedded ? t('acc.introMerged') : t('acc.tagline')}</p>
        </div>
        {monthly.size > 0 && (
          <div className="col" style={{ textAlign: 'right', marginLeft: 'auto' }}>
            <span className="label">{t('plan.stackMonthly')}</span>
            <span className="w9" style={{ fontSize: '1.5rem', lineHeight: 1.25 }}>{[...monthly].map(([cur, v]) => priceLabel(Math.round(v * 100) / 100, cur, 'month', t, lang)).join(' + ')}</span>
            <span className="t-xs t-mute">{t('acc.subsTotal', { n: String(subs) })}</span>
          </div>
        )}
        {!denied && <button className="btn btn-primary" onClick={() => setEditing('new')}>{t('acc.addAccess')}</button>}
      </div>

      {denied ? <div className="card t-mute">{t('acc.ownersOnly')}</div> : (
        <div className="col g24">
          <div className="col g12 min-w-0">
          <AppsToolbar view={view} set={set} q={q} setQ={setQ} counts={counts}
            extra={view.layout === 'list' && (
              <details className="apps-cols">
                <summary className="apps-cols-btn" title={t('acc.columns')} aria-label={t('acc.columns')}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
                </summary>
                <div className="apps-cols-menu" role="group" aria-label={t('acc.columns')}>
                  <span className="label">{t('acc.columns')}</span>
                  {ALL_COLS.map((c) => (
                    <label key={c} className="row g8 t-sm"><input type="checkbox" checked={cols.includes(c)} onChange={() => toggle(c)} /> {label[c]}</label>
                  ))}
                </div>
              </details>
            )} />
          {loading ? <p className="t-sm t-mute">{t('common.loading')}…</p> : list.length === 0 ? <div className="card t-mute">{t('acc.empty')}</div>
            : <AppsList brandId={current.id} list={list} view={view} q={q} cols={cols} onEdit={setEditing} onClear={() => { setQ(''); set({ filter: 'all' }); }} />}
          <p className="t-xs t-mute">{t('acc.revealNote')}</p>
          </div>
          <details className="acc-safety">
          <summary className="w7">{t('acc.safetyFold')}</summary>
          <aside className="grid grid-cols-1 items-start gap-4 md:grid-cols-2" style={{ marginTop: '0.75rem' }}>
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
          </details>
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
