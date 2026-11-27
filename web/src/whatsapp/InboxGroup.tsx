import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import type { Brand } from '../brands/BrandProvider';
import { fmtPhone, shortWhen } from './format';
import type { WaGroup, WaItem } from './useWaInbox';

type Person = { uid: string; label: string };
// Members of a brand, read once per brand while the page is open.
const peopleCache = new Map<string, Promise<Person[]>>();
function peopleOf(brandId: string): Promise<Person[]> {
  if (!peopleCache.has(brandId)) {
    peopleCache.set(brandId, getDocs(collection(db, 'brands', brandId, 'members'))
      .then((s) => s.docs.map((d) => ({ uid: d.id, label: String(d.get('name') || d.get('email') || d.id) })))
      .catch((e) => { peopleCache.delete(brandId); throw e; }));
  }
  return peopleCache.get(brandId)!;
}

/** One number waiting: count, last message and short date; tapping opens every message. «Link…» opens brand + person in place. */
export function InboxGroup({ g, brands }: { g: WaGroup; brands: Brand[] }) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [linking, setLinking] = useState(false);
  const [brandId, setBrandId] = useState(g.brandId ?? '');
  const [uid, setUid] = useState(g.uid ?? '');
  const [people, setPeople] = useState<Person[] | null>(null);
  const [busy, setBusy] = useState(false);
  const n = g.items.length;
  const phone = fmtPhone(g.phone);
  const brandName = g.brandId ? brands.find((b) => b.id === g.brandId)?.name : undefined;
  const title = g.chat && brandName ? `${t('wa.client')} ${brandName}` : g.name || phone;
  const ready = !!(g.chat && g.brandId && g.uid);

  useEffect(() => {
    if (!linking || !brandId) { setPeople(null); return; }
    let live = true;
    setPeople(null);
    peopleOf(brandId).then((p) => { if (live) setPeople(p); }, () => { if (live) setPeople([]); });
    return () => { live = false; };
  }, [linking, brandId]);

  const body = (i: WaItem) => i.text?.trim() ? i.text : i.media?.length ? t('wa.files', { n: i.media.length }) : t('wa.noText');

  async function assign(b: string, u: string) {
    setBusy(true);
    try {
      await api(`/v1/admin/whatsapp/inbox/${g.last.id}/assign`, { method: 'POST', body: JSON.stringify({ brandId: b, uid: u }) });
      toast({ text: t('wa.assigned'), tone: 'ok' });
      setLinking(false);
    } catch (e) {
      const status = (e as { status?: number })?.status;
      toast({ text: t(status === 409 ? 'mywa.taken' : 'wa.error'), tone: 'bad' });
    }
    setBusy(false);
  }
  async function dismissAll() {
    setBusy(true);
    let done = 0;
    for (const i of g.items) {
      try { await api(`/v1/admin/whatsapp/inbox/${i.id}/dismiss`, { method: 'POST', body: '{}' }); done++; } catch { /* keep going */ }
    }
    if (done < n) toast({ text: t('wa.error'), tone: 'bad' });
    setBusy(false);
  }

  return (
    <li className="wa-row">
      <button type="button" className="wa-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="wa-name">{title}<span className="wa-count">{n}</span></span>
        <span className="wa-line t-xs t-mute">
          {(g.name || (g.chat && brandName)) ? `${phone} · ` : ''}«{body(g.last)}» · {shortWhen(g.last.at?.toDate(), lang, t)}
        </span>
      </button>
      {open && (
        <ul className="wa-msgs">
          {g.items.map((i) => (
            <li key={i.id} className="t-sm">
              <span className="t-xs t-mute">{shortWhen(i.at?.toDate(), lang, t)}</span>
              <p className={i.text?.trim() ? 'wa-text' : 'wa-text t-mute'}>{body(i)}</p>
            </li>
          ))}
        </ul>
      )}
      {!linking && (
        <div className="row g8 wrap">
          {ready
            ? <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => assign(g.brandId!, g.uid!)}>{t('wa.toRequest')}</button>
            : <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setLinking(true)}>{t('wa.link')}</button>}
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={dismissAll}>{n > 1 ? t('wa.dismissN', { n }) : t('wa.dismiss')}</button>
        </div>
      )}
      {linking && (
        <div className="wa-panel col g8" role="group" aria-label={t('wa.link')}>
          <div className="row g8 wrap">
            <select className="input wa-select" value={brandId} onChange={(e) => { setBrandId(e.target.value); setUid(''); }} aria-label={t('wa.brand')}>
              <option value="">{t('wa.brand')}</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="input wa-select" disabled={!brandId || !people} value={uid} onChange={(e) => setUid(e.target.value)} aria-label={t('wa.person')}>
              <option value="">{t('wa.person')}</option>
              {(people ?? []).map((p) => <option key={p.uid} value={p.uid}>{p.label}</option>)}
            </select>
          </div>
          <span className="t-xs t-mute">{t('wa.linkLatest')}</span>
          <div className="row g8 wrap">
            <button type="button" className="btn btn-primary btn-sm" disabled={busy || !brandId || !uid} onClick={() => assign(brandId, uid)}>{t('wa.assign')}</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setLinking(false)}>{t('wa.cancel')}</button>
          </div>
        </div>
      )}
    </li>
  );
}
