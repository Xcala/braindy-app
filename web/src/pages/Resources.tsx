import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { KINDS, useResources, type Kind, type Resource } from '../resources/useResources';
import { ResourceItem } from '../resources/ResourceItem';
import { ResourceDetail } from '../resources/ResourceDetail';
import { ResourceEditor } from '../resources/ResourceEditor';
import '../accesses/apps.css';
import '../resources/resources.css';

const LAYOUT = 'bd-res-layout';
const savedLayout = (): 'list' | 'grid' => { try { return localStorage.getItem(LAYOUT) === 'list' ? 'list' : 'grid'; } catch { return 'grid'; } };
const ListIcon = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
const GridIcon = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;

/** Free resources: the same library for every client (skills, scripts, prompts, templates…), in a grid or a list. NickMark adds and edits here. */
export function Resources() {
  const { t, lang } = useI18n();
  const { list, loading, admin } = useResources();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<Kind | ''>('');
  const [layout, setLayoutState] = useState(savedLayout);
  const setLayout = (l: 'list' | 'grid') => { setLayoutState(l); try { localStorage.setItem(LAYOUT, l); } catch { /* private mode */ } };
  const [open, setOpen] = useState<Resource | null>(null);
  const [editing, setEditing] = useState<Resource | null | 'new'>(null);

  const present = KINDS.filter((k) => list.some((r) => r.kind === k));
  const shown = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return list.filter((r) => (!kind || r.kind === kind) && words.every((w) =>
      [r.title.es, r.title.en, r.summary.es, r.summary.en, ...r.tags, t(`res.kind.${r.kind}`)].join(' ').toLowerCase().includes(w)));
  }, [list, q, kind, t, lang]);

  return (
    <div className="col g24">
      <div className="row between g16 wrap" style={{ alignItems: 'flex-end' }}>
        <div className="col g8" style={{ maxWidth: 720 }}>
          <h1 className="h1"><span className="w9">{t('res.title')}.</span></h1>
          <p className="t-md t-mute">{t('res.sub')}</p>
        </div>
        {admin && <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" size={18} />{t('res.new')}</button>}
      </div>
      {list.length > 0 && (
        <div className="col g12">
          <div className="apps-bar">
            <label className="apps-search">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input type="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('res.search')} aria-label={t('res.search')} onKeyDown={(e) => e.key === 'Escape' && setQ('')} />
            </label>
            <div className="apps-seg" role="radiogroup" aria-label={t('res.view')}>
              {(['grid', 'list'] as const).map((l) => (
                <button key={l} type="button" role="radio" aria-checked={layout === l} title={t(l === 'list' ? 'res.list' : 'res.grid')} aria-label={t(l === 'list' ? 'res.list' : 'res.grid')} onClick={() => setLayout(l)}>{l === 'list' ? ListIcon : GridIcon}</button>
              ))}
            </div>
          </div>
          {present.length > 1 && (
            <div className="row g8 wrap" role="group" aria-label={t('res.f.kind')}>
              {(['', ...present] as const).map((k) => (
                <button key={k || 'all'} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`btn btn-sm ${kind === k ? 'btn-primary' : 'btn-secondary'}`}>
                  {k ? t(`res.kind.${k}`) : t('res.all')} <span className="apps-n">{k ? list.filter((r) => r.kind === k).length : list.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {loading ? <div className="skel" style={{ height: 200 }} />
        : list.length === 0 ? <div className="card t-mute">{t('res.empty')}</div>
        : shown.length === 0 ? <div className="card t-mute">{t('res.noMatch')}</div>
        : <ul className={layout === 'grid' ? 'res-grid' : 'res-list card'}>
            {shown.map((r) => <ResourceItem key={r.id} r={r} layout={layout} onOpen={() => setOpen(r)} onEdit={admin ? () => setEditing(r) : undefined} />)}
          </ul>}
      {open && <ResourceDetail r={open} onClose={() => setOpen(null)} />}
      {editing && <ResourceEditor r={editing === 'new' ? null : editing} nextOrder={list.length} onClose={() => setEditing(null)} />}
    </div>
  );
}
