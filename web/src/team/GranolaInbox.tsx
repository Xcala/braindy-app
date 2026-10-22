import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';

type Item = { id: string; title: string; date: string; attendees?: string[]; webUrl?: string | null };

/** NickMark only: Granola meetings that could not be matched to a brand. Assigning one teaches the domains. */
export function GranolaInbox() {
  const { t } = useI18n();
  const { brands } = useBrands();
  const [items, setItems] = useState<Item[]>([]);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => onSnapshot(query(collection(db, 'granolaInbox'), where('status', '==', 'unassigned')),
    (s) => setItems(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Item).sort((a, b) => b.date.localeCompare(a.date))), () => setItems([])), []);
  const active = brands.filter((b) => b.status === 'active').sort((a, b) => a.name.localeCompare(b.name));

  async function sync() {
    setBusy(true); setMsg(t('gra.syncing'));
    try {
      const r = await api<{ filed: number; inbox: number; empty: number }>('/v1/admin/granola/sync?days=30', { method: 'POST', body: '{}' });
      setMsg(t('gra.synced', { filed: r.filed, inbox: r.inbox }));
    } catch (e) { setMsg(String(e).includes('503') ? t('gra.notConfigured') : t('brains.error')); } finally { setBusy(false); }
  }
  const assign = (id: string) => pick[id] && api(`/v1/admin/granola/inbox/${id}/assign`, { method: 'POST', body: JSON.stringify({ brandId: pick[id] }) });
  const ignore = (id: string) => api(`/v1/admin/granola/inbox/${id}/ignore`, { method: 'POST', body: '{}' });

  return (
    <section className="card col g12" aria-labelledby="h-granola">
      <div className="row between g8 wrap">
        <div className="col"><h2 className="h3" id="h-granola">{t('gra.title')}</h2><span className="t-xs t-mute">{t('gra.sub')}</span></div>
        <button className="btn btn-secondary btn-sm" disabled={busy} onClick={sync}>{t('gra.sync')}</button>
      </div>
      {msg && <p className="t-sm" role="status">{msg}</p>}
      {items.length === 0 && <p className="t-sm t-mute">{t('gra.empty')}</p>}
      {items.map((i) => (
        <div key={i.id} className="col g8" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
          <div className="row between g8 wrap">
            <span className="t-sm"><b>{i.title}</b> <span className="t-mute">· {i.date}</span></span>
            {i.webUrl && <a className="t-xs" href={i.webUrl} target="_blank" rel="noreferrer">Granola</a>}
          </div>
          {i.attendees?.length ? <span className="t-xs t-mute truncate">{i.attendees.join(', ')}</span> : null}
          <div className="row g8 wrap">
            <select className="input" style={{ height: 36, width: 'auto', minWidth: 200 }} value={pick[i.id] ?? ''} onChange={(e) => setPick({ ...pick, [i.id]: e.target.value })} aria-label={t('gra.brand')}>
              <option value="">{t('gra.brand')}</option>
              {active.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" disabled={!pick[i.id]} onClick={() => assign(i.id)}>{t('gra.assign')}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => ignore(i.id)}>{t('gra.ignore')}</button>
          </div>
        </div>
      ))}
    </section>
  );
}
