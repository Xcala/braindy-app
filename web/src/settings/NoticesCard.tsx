import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import { noticesApi, type NoticeSettings } from '../review/api';

type Approver = { uid: string; email: string; role: string };
const KEYS = ['delivery', 'approved', 'brandBrain', 'report'] as const;

/** Settings · WhatsApp and notices: the number that receives review links and which notices go out. */
export function NoticesCard({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const [s, setS] = useState<NoticeSettings | null>(null);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setS(null); setMsg(null);
    noticesApi.get(brandId).then(setS).catch(() => setS({}));
    getDocs(collection(db, 'brands', brandId, 'members')).then((snap) => setApprovers(snap.docs
      .map((d) => ({ uid: d.id, email: String(d.get('email') ?? d.id), role: String(d.get('role')), can: d.get('canApprove') === true }))
      .filter((m) => m.role === 'client_owner' || m.can))).catch(() => setApprovers([]));
  }, [brandId]);

  if (!s) return <div className="card t-mute">{t('common.loading')}…</div>;
  const on = (k: (typeof KEYS)[number]) => s.notices?.[k] !== false;
  const set = (patch: Partial<NoticeSettings>) => setS({ ...s, ...patch });

  async function save() {
    setBusy(true); setMsg(null);
    try { await noticesApi.save(brandId, s!); setMsg({ ok: true, text: t('set.saved') }); }
    catch (e) { setMsg({ ok: false, text: String(e).includes('403') ? t('set.ownersOnly') : String(e).includes('400') ? t('set.badPhone') : t('set.saveError') }); }
    finally { setBusy(false); }
  }

  return (
    <div className="col g24">
      <div className="card col g16">
        <div className="row between g8 wrap">
          <h2 className="h3">WhatsApp</h2>
          <span className={`chip ${s.whatsapp ? 'c-active' : 'c-draft'}`}>{s.whatsapp ? t('set.connected') : t('set.notConnected')}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="field">
            <label htmlFor="wa-num">{t('set.number')}</label>
            <input id="wa-num" className="input" inputMode="tel" placeholder="+57 300 000 0000" value={s.whatsapp ?? ''} onChange={(e) => set({ whatsapp: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="wa-who">{t('set.whoApproves')}</label>
            <select id="wa-who" className="input" value={s.approverUid ?? ''} onChange={(e) => set({ approverUid: e.target.value })}>
              <option value="">{t('set.pickApprover')}</option>
              {approvers.map((a) => <option key={a.uid} value={a.uid}>{a.email}</option>)}
            </select>
          </div>
        </div>
        <p className="help">{t('set.waHelp')}</p>
        {!s.whatsappApi && <p className="help">{t('set.apiPending')}</p>}
      </div>
      <div className="card col g12">
        <h2 className="h3">{t('set.notices')}</h2>
        {KEYS.map((k) => (
          <div key={k} className="row between g12" style={{ padding: '6px 0' }}>
            <span className="col"><span className="w7 t-sm">{t(`set.n.${k}`)}</span><span className="t-xs t-mute">{t(`set.n.${k}Sub`)}</span></span>
            <button className={`switch ${on(k) ? 'is-on' : ''}`} role="switch" aria-checked={on(k)} aria-label={t(`set.n.${k}`)}
              onClick={() => set({ notices: { ...s.notices, [k]: !on(k) } })} />
          </div>
        ))}
        <div className="field" style={{ maxWidth: 240 }}>
          <label htmlFor="wa-lang">{t('set.noticeLang')}</label>
          <select id="wa-lang" className="input" value={s.lang ?? 'es'} onChange={(e) => set({ lang: e.target.value as 'es' | 'en' })}>
            <option value="es">Español</option><option value="en">English</option>
          </select>
        </div>
      </div>
      <div className="row g12 wrap">
        <button className="btn btn-primary" disabled={busy || (!!s.whatsapp && !s.approverUid)} onClick={save}>{t('set.save')}</button>
        {!!s.whatsapp && !s.approverUid && <span className="t-sm t-mute">{t('set.needApprover')}</span>}
        {msg && <span className="t-sm" role="status" style={{ color: msg.ok ? 'var(--success)' : 'var(--danger)' }}>{msg.text}</span>}
      </div>
    </div>
  );
}
