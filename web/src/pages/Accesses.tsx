import { useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { ALL_COLS, AccessRow, gridFor, type AccessCol } from '../accesses/AccessRow';
import { AccessForm } from '../accesses/AccessForm';
import { useAccessLog, useAccesses, type Access } from '../accesses/useAccesses';

/** Accesses (design 07): encrypted credentials, reveal on demand, read-only access log. */
export function Accesses() {
  const { current } = useBrands();
  const { t, lang } = useI18n();
  const { list, loading, denied } = useAccesses(current?.id);
  const log = useAccessLog(denied ? undefined : current?.id);
  const [editing, setEditing] = useState<Access | null | 'new'>(null);
  const [cols, setCols] = useState<AccessCol[]>(loadCols);
  const toggle = (c: AccessCol) => setCols((now) => { const next = now.includes(c) ? now.filter((x) => x !== c) : ALL_COLS.filter((x) => x === c || now.includes(x)); saveCols(next); return next; });
  const label: Record<AccessCol, string> = { user: t('acc.user'), password: t('acc.password'), link: t('acc.link'), notes: t('acc.notes') };
  if (!current) return <p className="t-mute">{t('brand.none')}</p>;

  const when = (d?: Date) => {
    if (!d) return '';
    const today = new Date().toDateString() === d.toDateString();
    return today ? d.toLocaleTimeString(lang === 'es' ? 'es-CO' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="col g32">
      <div className="row between g16 wrap">
        <div className="col g8">
          <p className="label">{current.name}</p>
          <h1 className="h1">{t('nav.accesses')}</h1>
          <p className="t-mute">{t('acc.tagline')}</p>
        </div>
        {!denied && <button className="btn btn-primary" onClick={() => setEditing('new')}>{t('acc.addAccess')}</button>}
      </div>

      {denied ? <div className="card t-mute">{t('acc.ownersOnly')}</div> : (
        <div className="col g24">
          <div className="col g12 min-w-0">
          <div className="row g8 wrap" role="group" aria-label={t('acc.columns')}>
            <span className="label">{t('acc.columns')}</span>
            {ALL_COLS.map((c) => (
              <button key={c} type="button" aria-pressed={cols.includes(c)} onClick={() => toggle(c)} className={`btn btn-sm ${cols.includes(c) ? 'btn-primary' : 'btn-secondary'}`}>{cols.includes(c) ? '✓ ' : ''}{label[c]}</button>
            ))}
          </div>
          <div className="table overflow-x-auto">
            <div className="trow head label" style={{ gridTemplateColumns: gridFor(cols), minWidth: 260 + cols.length * 170 }}>
              <span>{t('acc.platform')}</span>{cols.map((c) => <span key={c}>{label[c]}</span>)}<span />
            </div>
            {loading && <p className="t-sm t-mute" style={{ padding: 16 }}>{t('common.loading')}…</p>}
            {!loading && list.length === 0 && <p className="t-sm t-mute" style={{ padding: 16 }}>{t('acc.empty')}</p>}
            {list.map((a) => <AccessRow key={a.id} brandId={current.id} a={a} cols={cols} onEdit={() => setEditing(a)} />)}
          </div>
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
              <p className="t-sm t-mute">{t('acc.howBody')}</p>
            </div>
          </aside>
        </div>
      )}
      {editing && <AccessForm brandId={current.id} editing={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

const COLS_KEY = 'acc-cols';
/** Visible columns, remembered in this browser. Default: user, password and link. */
function loadCols(): AccessCol[] {
  try { const v = JSON.parse(localStorage.getItem(COLS_KEY) ?? 'null'); if (Array.isArray(v)) return ALL_COLS.filter((c) => v.includes(c)); } catch { /* storage blocked */ }
  return ['user', 'password', 'link'];
}
function saveCols(cols: AccessCol[]) { try { localStorage.setItem(COLS_KEY, JSON.stringify(cols)); } catch { /* storage blocked */ } }
