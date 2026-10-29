import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';

type Status = 'delivered' | 'in_progress' | 'decision' | 'client' | 'discarded';
interface SiteChange { id: string; key: string; group?: string; title: string; request?: string; source?: string; delivered?: string; status: Status; link?: string; round?: string; updatedAt?: Timestamp }

const STATUSES: Status[] = ['delivered', 'in_progress', 'decision', 'client', 'discarded'];
const CHIP: Record<Status, string> = { delivered: 'c-approved', in_progress: 'c-prod', decision: 'c-approve', client: 'c-approve', discarded: 'c-archived' };

function useSiteChanges(brandId: string) {
  const [list, setList] = useState<SiteChange[]>([]);
  useEffect(() => onSnapshot(query(collection(db, 'brands', brandId, 'siteChanges'), orderBy('order')),
    (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as SiteChange)), () => setList([])), [brandId]);
  return list;
}

/** Site adjustments: the website triage synced from each site's working session (asked, delivered, state). */
export function SiteChanges({ brandId }: { brandId: string }) {
  const { t, lang } = useI18n();
  const isAdmin = useAuth().profile?.role === 'admin';
  const list = useSiteChanges(brandId);
  const [filter, setFilter] = useState<Status | ''>('');
  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, list.filter((x) => x.status === s).length])) as Record<Status, number>, [list]);
  const groups = useMemo(() => {
    const out = new Map<string, SiteChange[]>();
    for (const x of list) if (!filter || x.status === filter) out.set(x.group || '—', [...(out.get(x.group || '—') ?? []), x]);
    return [...out];
  }, [list, filter]);
  if (!list.length) return null;
  const last = Math.max(...list.map((x) => x.updatedAt?.toMillis() ?? 0));
  const status = (s: Status) => t(`site.status.${s}` as StringKey);

  return (
    <section className="col g16" aria-labelledby="h-site">
      <div className="row between g12 wrap" style={{ alignItems: 'flex-end' }}>
        <div className="col g4">
          <h2 className="h3" id="h-site">{t('site.title')}</h2>
          <p className="t-sm t-mute">{t('site.sub', { n: list.length })}{last ? ` · ${t('site.updated', { date: new Date(last).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'long' }) })}` : ''}</p>
        </div>
      </div>
      <div className="row g8 wrap" role="group" aria-label={t('site.filter')}>
        <button type="button" className={`btn btn-sm ${!filter ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={!filter} onClick={() => setFilter('')}>{t('site.all')} · {list.length}</button>
        {STATUSES.filter((s) => counts[s]).map((s) => (
          <button key={s} type="button" className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={filter === s} onClick={() => setFilter(filter === s ? '' : s)}>{status(s)} · {counts[s]}</button>
        ))}
      </div>
      {groups.map(([group, items]) => (
        <details key={group} className="card col" open={groups.length <= 3 || items.some((x) => x.status !== 'delivered')} style={{ padding: '14px 18px' }}>
          <summary className="row between g12" style={{ cursor: 'pointer', listStyle: 'none' }}>
            <span className="w7">{group}</span><span className="t-xs t-mute">{items.length}</span>
          </summary>
          <div className="col" style={{ marginTop: 8 }}>
            {items.map((x) => (
              <article key={x.id} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_170px]" style={{ padding: '14px 0', borderTop: '1px solid var(--line)' }}>
                <div className="col g4 min-w-0">
                  <span className="t-xs t-mute">{x.key}</span>
                  <span className="w7">{x.title}</span>
                  {x.request && <span className="t-sm">{x.request}</span>}
                  {x.source && <span className="t-xs t-mute">{x.source}</span>}
                </div>
                <div className="col g4 min-w-0">
                  {x.delivered && <><span className="label">{t('site.done')}</span><span className="t-sm" style={{ whiteSpace: 'pre-line' }}>{x.delivered}</span></>}
                  {x.link && <a href={x.link} target="_blank" rel="noreferrer" className="t-sm">{t('site.seeChange')}</a>}
                </div>
                <div>
                  {isAdmin ? (
                    <select className="input" style={{ height: 36, fontSize: 13 }} aria-label={`${t('site.state')} ${x.key}`} value={x.status}
                      onChange={(e) => updateDoc(doc(db, 'brands', brandId, 'siteChanges', x.id), { status: e.target.value, updatedAt: serverTimestamp() })}>
                      {STATUSES.map((s) => <option key={s} value={s}>{status(s)}</option>)}
                    </select>
                  ) : <span className={`chip ${CHIP[x.status]}`}>{status(x.status)}</span>}
                </div>
              </article>
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}
