import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';

export type Status = 'delivered' | 'in_progress' | 'decision' | 'client' | 'discarded';
export interface SiteChange { id: string; key: string; group?: string; title: string; request?: string; source?: string; delivered?: string; status: Status; link?: string; round?: string; updatedAt?: Timestamp }

export const STATUSES: Status[] = ['delivered', 'in_progress', 'decision', 'client', 'discarded'];

export function useSiteChanges(brandId: string) {
  const [list, setList] = useState<SiteChange[]>([]);
  useEffect(() => onSnapshot(query(collection(db, 'brands', brandId, 'siteChanges'), orderBy('order')),
    (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }) as SiteChange)), () => setList([])), [brandId]);
  return list;
}

/** Share delivered, leaving out what was discarded. */
export const pct = (items: SiteChange[]) => {
  const live = items.filter((x) => x.status !== 'discarded');
  return live.length ? Math.round((live.filter((x) => x.status === 'delivered').length / live.length) * 100) : 100;
};

/** Site adjustments: the website triage synced from each site's working session (asked, delivered, state).
 *  Builder's craft, signed by NickMark: progress at a glance, a legend that filters, one card per point. */
export function SiteChanges({ brandId }: { brandId: string }) {
  const { t, lang } = useI18n();
  const isAdmin = useAuth().profile?.role === 'admin';
  const list = useSiteChanges(brandId);
  const [filter, setFilter] = useState<Status | ''>('');
  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, list.filter((x) => x.status === s).length])) as Record<Status, number>, [list]);
  const groups = useMemo(() => {
    const out = new Map<string, SiteChange[]>();
    for (const x of list) out.set(x.group || '—', [...(out.get(x.group || '—') ?? []), x]);
    return [...out].map(([g, all]) => [g, all, all.filter((x) => !filter || x.status === filter)] as const).filter(([, , shown]) => shown.length);
  }, [list, filter]);
  if (!list.length) return null;
  const last = Math.max(...list.map((x) => x.updatedAt?.toMillis() ?? 0));
  const status = (s: Status) => t(`site.status.${s}` as StringKey);
  const total = pct(list);

  return (
    <section className="sx col g16" aria-labelledby="h-site">
      <header className="sx-head">
        <div className="sx-top">
          <div className="col g8 min-w-0">
            <span className="sx-by"><span className="brain b-builder"><img src="/brand/brains/builder.png" alt="" /></span>{t('site.by')}</span>
            <h2 className="sx-title" id="h-site">{t('site.title')}</h2>
            <p className="t-sm t-mute" style={{ margin: 0 }}>{t('site.sub', { n: list.length })}{last ? ` · ${t('site.updated', { date: new Date(last).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'long' }) })}` : ''}</p>
          </div>
          <div className="sx-pct" aria-label={`${total}% ${t('site.pct')}`}><b>{total}<small>%</small></b><span>{t('site.pct')}</span></div>
        </div>
        <div className="sx-bar" aria-hidden="true">
          {STATUSES.filter((s) => counts[s]).map((s) => <span key={s} className={`is-${s}`} style={{ flexGrow: counts[s] }} />)}
        </div>
        <div className="sx-legend" role="group" aria-label={t('site.filter')}>
          <button type="button" aria-pressed={!filter} onClick={() => setFilter('')}>{t('site.all')}<em>{list.length}</em></button>
          {STATUSES.filter((s) => counts[s]).map((s) => (
            <button key={s} type="button" className={`is-${s}`} aria-pressed={filter === s} onClick={() => setFilter(filter === s ? '' : s)}>
              <i />{status(s)}<em>{counts[s]}</em>
            </button>
          ))}
        </div>
      </header>

      {groups.map(([group, all, items]) => {
        const done = all.filter((x) => x.status === 'delivered').length;
        const live = all.filter((x) => x.status !== 'discarded').length;
        return (
          <details key={group} className="sx-group" open={groups.length <= 3 || !!filter || items.some((x) => x.status !== 'delivered')}>
            <summary>
              <span className="sx-gname">{group}</span>
              <span className="sx-gprog"><span className="sx-mini"><span style={{ width: `${pct(all)}%` }} /></span><span className="t-xs t-mute">{done}/{live}</span></span>
              <svg className="sx-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="sx-items">
              {items.map((x) => (
                <article key={x.id} className={`sx-item is-${x.status}`}>
                  <div className="sx-itop">
                    <span className="sx-key">{x.key}</span>
                    {isAdmin ? (
                      <select className={`sx-status is-${x.status}`} aria-label={`${t('site.state')} ${x.key}`} value={x.status}
                        onChange={(e) => updateDoc(doc(db, 'brands', brandId, 'siteChanges', x.id), { status: e.target.value, updatedAt: serverTimestamp() })}>
                        {STATUSES.map((s) => <option key={s} value={s}>{status(s)}</option>)}
                      </select>
                    ) : <span className={`sx-status is-${x.status}`}>{status(x.status)}</span>}
                  </div>
                  <h3 className="sx-ititle">{x.title}</h3>
                  {x.source && <span className="sx-src">{x.source}</span>}
                  <div className="sx-cols">
                    {x.request && <div className="sx-asked"><span className="sx-lbl">{t('site.asked')}</span><p>{x.request}</p></div>}
                    {x.delivered && (
                      <div className="sx-done">
                        <span className="sx-lbl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>{t('site.done')}</span>
                        <p>{x.delivered}</p>
                      </div>
                    )}
                  </div>
                  {x.link && <a className="sx-link" href={x.link} target="_blank" rel="noreferrer">{t('site.seeChange')}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg></a>}
                </article>
              ))}
            </div>
          </details>
        );
      })}
    </section>
  );
}
