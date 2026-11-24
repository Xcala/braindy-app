import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import { noticesApi, type NoticeSettings } from '../review/api';

type Card = 'wa' | 'notices';
type Approver = { uid: string; email: string; role: string };
const KEYS = ['delivery', 'approved', 'published', 'brandBrain', 'report'] as const;
/** Same rule as the API: an invite link of WhatsApp itself. */
const GROUP = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,40}$/;

/** Settings · WhatsApp and notices: the number that receives review links and which notices go out. */
export function NoticesCard({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const [s, setS] = useState<NoticeSettings | null>(null);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; card: Card } | null>(null);
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
  const set = (patch: Partial<NoticeSettings>) => { setS({ ...s, ...patch }); setMsg(null); };

  async function save(card: Card) {
    if ((s!.groups ?? []).some((g) => g.url && !GROUP.test(g.url))) { setMsg({ ok: false, text: t('set.badGroup'), card }); return; }
    setBusy(true); setMsg(null);
    try { await noticesApi.save(brandId, s!); setMsg({ ok: true, text: t('set.saved'), card }); }
    catch (e) { setMsg({ ok: false, text: String(e).includes('403') ? t('set.ownersOnly') : String(e).includes('400') ? t('set.badPhone') : t('set.saveError'), card }); }
    finally { setBusy(false); }
  }

  // Save sits on top of each card, small, so it is always in view next to what was just changed.
  const blocked = !!s.whatsapp && !s.approverUid;
  const saveBtn = (card: Card) => (
    <button type="button" className="btn btn-primary btn-sm" disabled={busy || blocked} onClick={() => save(card)}>
      {msg?.ok && msg.card === card ? `✓ ${t('set.saved').replace(/\.$/, '')}` : t('set.save')}
    </button>
  );
  const note = (card: Card) => (blocked && card === 'wa' ? <span className="t-sm t-mute">{t('set.needApprover')}</span>
    : msg && !msg.ok && msg.card === card ? <span className="t-sm" role="status" style={{ color: 'var(--danger)' }}>{msg.text}</span> : null);

  return (
    <div className="col g24">
      <div className="card col g16">
        <div className="row between g8">
          <span className="row g8 wrap min-w-0">
            <h2 className="h3">WhatsApp</h2>
            <span className={`chip ${s.whatsapp ? 'c-active' : 'c-draft'}`}>{s.whatsapp ? t('set.connected') : t('set.notConnected')}</span>
          </span>
          {saveBtn('wa')}
        </div>
        {note('wa')}
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
        <div className="col g8">
          <span className="w7 t-sm">{t('set.groups')}</span>
          {(s.groups ?? []).map((g, i) => {
            const put = (patch: Partial<typeof g>) => set({ groups: (s.groups ?? []).map((x, j) => (j === i ? { ...x, ...patch } : x)) });
            return (
              <div key={i} className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
                <input className="input" aria-label={t('set.groupName')} placeholder={t('set.groupNamePh')} value={g.name ?? ''} onChange={(e) => put({ name: e.target.value })} />
                <input className="input" inputMode="url" aria-label={t('set.group')} placeholder="https://chat.whatsapp.com/…" value={g.url ?? ''} onChange={(e) => put({ url: e.target.value.trim() })} />
                <span className="row g8">
                  {g.url && GROUP.test(g.url) && <a className="btn btn-secondary btn-sm" href={g.url} target="_blank" rel="noreferrer">{t('set.groupOpen')}</a>}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ groups: (s.groups ?? []).filter((_, j) => j !== i) })}>{t('set.groupRemove')}</button>
                </span>
              </div>
            );
          })}
          {(s.groups ?? []).length < 10 && <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => set({ groups: [...(s.groups ?? []), { name: '', url: '' }] })}>+ {t('set.groupAdd')}</button>}
          <p className="help">{t('set.groupHelp')}</p>
        </div>
        <p className="help">{t('set.waHelp')}</p>
        {!s.whatsappApi && <p className="help">{t('set.apiPending')}</p>}
      </div>
      <div className="card col g12">
        <div className="row between g8">
          <h2 className="h3">{t('set.notices')}</h2>
          {saveBtn('notices')}
        </div>
        {note('notices')}
        {KEYS.map((k) => (
          <div key={k} className="row between g12" style={{ padding: '0.375rem 0' }}>
            <span className="col"><span className="w7 t-sm">{t(`set.n.${k}`)}</span><span className="t-xs t-mute">{t(`set.n.${k}Sub`)}</span></span>
            <button className={`switch ${on(k) ? 'is-on' : ''}`} role="switch" aria-checked={on(k)} aria-label={t(`set.n.${k}`)}
              onClick={() => set({ notices: { ...s.notices, [k]: !on(k) } })} />
          </div>
        ))}
        <div className="col g6">
          <span className="t-sm w7" id="wa-lang">{t('set.noticeLang')}</span>
          <div className="seg self-start" role="radiogroup" aria-labelledby="wa-lang">
            {([['es', 'Español'], ['en', 'English']] as const).map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={(s.lang ?? 'es') === v} className={(s.lang ?? 'es') === v ? 'is-on' : ''} onClick={() => set({ lang: v })}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
