import { useEffect, useState } from 'react';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';

type Status = {
  sending: boolean; receiving: boolean; lastWebhookAt: string | null; inbound: number;
  lastError: { code: number | null; title: string; at: string | null } | null;
};
type Item = { id: string; phone: string; name?: string; text?: string; media?: unknown[]; at?: { toDate: () => Date }; kind?: 'chat'; uid?: string; brandId?: string };
type Person = { uid: string; label: string };

/** NickMark only: WhatsApp channel status, messages from numbers no brand knows yet, and clients' chat (greetings, thanks) kept out of requests. */
export function WhatsappInbox() {
  const { t } = useI18n();
  const { brands } = useBrands();
  const [st, setSt] = useState<Status | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [brand, setBrand] = useState<Record<string, string>>({});
  const [person, setPerson] = useState<Record<string, string>>({});
  const [people, setPeople] = useState<Record<string, Person[]>>({});
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { api<Status>('/v1/admin/whatsapp/status').then(setSt).catch(() => setSt(null)); }, []);
  useEffect(() => onSnapshot(query(collection(db, 'waInbox'), where('status', '==', 'new')),
    (s) => setItems(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Item).sort((a, b) => (b.at?.toDate().getTime() ?? 0) - (a.at?.toDate().getTime() ?? 0))),
    () => setItems([])), []);
  const active = brands.filter((b) => b.status === 'active').sort((a, b) => a.name.localeCompare(b.name));

  async function loadPeople(brandId: string) {
    if (!brandId || people[brandId]) return;
    const snap = await getDocs(collection(db, 'brands', brandId, 'members')).catch(() => null);
    setPeople((p) => ({ ...p, [brandId]: (snap?.docs ?? []).map((d) => ({ uid: d.id, label: String(d.get('name') || d.get('email') || d.id) })) }));
  }
  function pickBrand(id: string, brandId: string) {
    setBrand({ ...brand, [id]: brandId }); setPerson({ ...person, [id]: '' });
    void loadPeople(brandId);
  }
  // A client's chat already knows its brand and person: both come filled in.
  const brandOf = (i: Item) => brand[i.id] ?? i.brandId ?? '';
  const personOf = (i: Item) => person[i.id] ?? (brand[i.id] === undefined ? i.uid : undefined) ?? '';
  useEffect(() => { items.forEach((i) => { if (i.brandId) void loadPeople(i.brandId); }); }, [items]); // eslint-disable-line react-hooks/exhaustive-deps
  async function act(item: Item, path: 'assign' | 'dismiss') {
    const id = item.id;
    setMsg(null);
    try {
      await api(`/v1/admin/whatsapp/inbox/${id}/${path}`, { method: 'POST', body: JSON.stringify(path === 'assign' ? { brandId: brandOf(item), uid: personOf(item) } : {}) });
      if (path === 'assign') setMsg(t('wa.assigned'));
    } catch { setMsg(t('wa.error')); }
  }
  const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : t('wa.never'));
  const chip = (on: boolean) => <span className={`chip ${on ? 'c-active' : 'c-draft'}`}>{on ? t('wa.on') : t('wa.off')}</span>;

  return (
    <section className="card col g12" aria-labelledby="h-wa">
      <div className="col"><h2 className="h3" id="h-wa">{t('wa.title')}</h2><span className="t-xs t-mute">{t('wa.sub')}</span></div>
      {st && (
        <div className="row g16 wrap t-sm">
          <span className="row g8">{t('wa.receiving')} {chip(st.receiving)}</span>
          <span className="row g8">{t('wa.sending')} {chip(st.sending)}</span>
          <span className="t-mute">{t('wa.lastWebhook')}: {when(st.lastWebhookAt)}</span>
          <span className="t-mute">{t('wa.inbound')}: {st.inbound}</span>
          {st.lastError && <span style={{ color: 'var(--danger)' }}>{t('wa.lastError')}: {st.lastError.title || st.lastError.code} · {when(st.lastError.at)}</span>}
        </div>
      )}
      {msg && <p className="t-sm" role="status">{msg}</p>}
      {items.length === 0 && <p className="t-sm t-mute">{t('wa.empty')}</p>}
      {items.map((i) => (
        <div key={i.id} className="col g8" style={{ borderTop: '1px solid var(--line)', paddingTop: '0.625rem' }}>
          <span className="t-sm">{i.kind === 'chat' && <span className="chip c-sent" style={{ marginRight: 6 }}>{t('wa.chat')}</span>}<b>{i.name || `+${i.phone}`}</b> <span className="t-mute">· +{i.phone}{i.at ? ` · ${i.at.toDate().toLocaleString()}` : ''}</span></span>
          {i.text && <p className="t-sm" style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{i.text}</p>}
          {i.media?.length ? <span className="t-xs t-mute">{t('wa.files', { n: i.media.length })}</span> : null}
          <div className="row g8 wrap">
            <select className="input" style={{ height: '2.25rem', width: 'auto', minWidth: '11.25rem' }} value={brandOf(i)} onChange={(e) => pickBrand(i.id, e.target.value)} aria-label={t('wa.brand')}>
              <option value="">{t('wa.brand')}</option>
              {active.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="input" style={{ height: '2.25rem', width: 'auto', minWidth: '11.25rem' }} disabled={!brandOf(i)} value={personOf(i)} onChange={(e) => setPerson({ ...person, [i.id]: e.target.value })} aria-label={t('wa.person')}>
              <option value="">{t('wa.person')}</option>
              {(people[brandOf(i)] ?? []).map((p) => <option key={p.uid} value={p.uid}>{p.label}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" disabled={!brandOf(i) || !personOf(i)} onClick={() => act(i, 'assign')}>{t(i.kind === 'chat' ? 'wa.toRequest' : 'wa.assign')}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => act(i, 'dismiss')}>{t('wa.dismiss')}</button>
          </div>
        </div>
      ))}
    </section>
  );
}
