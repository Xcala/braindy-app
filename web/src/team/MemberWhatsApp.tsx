import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { sendWhatsAppLink } from './membersApi';

const ERR: Record<string, 'wax.noPhone' | 'wax.badPhone' | 'wax.taken'> = { no_phone: 'wax.noPhone', invalid_phone: 'wax.badPhone', phone_taken: 'wax.taken' };

type Sent = { ok: boolean; key: 'wax.sent' | 'wax.manual' | 'wax.noPhone' | 'wax.badPhone' | 'wax.taken' | 'wax.error'; waMe?: string };

/** Sends a member their one-time sign-in link by WhatsApp: from the Braindy number, or from Nicolas's own WhatsApp. */
export async function deliverLink(brandId: string, uid: string, phone: string, lang: 'es' | 'en'): Promise<Sent> {
  try {
    const r = await sendWhatsAppLink(brandId, uid, phone, lang);
    return r.sent ? { ok: true, key: 'wax.sent' } : { ok: true, key: 'wax.manual', waMe: r.waMe };
  } catch (e) {
    return { ok: false, key: ERR[String((e as { body?: { error?: string } }).body?.error)] ?? 'wax.error' };
  }
}

/** The result line: sent, or a button that opens Nicolas's WhatsApp with the message ready (a tap, so no popup blocker). */
export function SentNote({ r }: { r: Sent }) {
  const { t } = useI18n();
  if (r.waMe) return <a className="btn btn-primary btn-sm self-start" href={r.waMe} target="_blank" rel="noreferrer">{t('wax.openWa')}</a>;
  return <p className="t-sm" role="status" style={{ color: r.ok ? 'var(--success)' : 'var(--danger)' }}>{t(r.key)}</p>;
}

/** Per member: "WhatsApp" → optional number → send the link. */
export function MemberWhatsApp({ brandId, uid, name }: { brandId: string; uid: string; name: string }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Sent | null>(null);

  async function send() {
    setBusy(true); setMsg(null);
    const r = await deliverLink(brandId, uid, phone, lang);
    setMsg(r); setBusy(false);
    if (r.ok) setOpen(false);
  }

  return (
    <div className="col g8" style={{ paddingLeft: '3.25rem' }}>
      {!open ? (
        <button type="button" className="btn btn-secondary btn-sm self-start" title={t('wax.sendTitle', { name })} onClick={() => setOpen(true)}>{t('wax.send')}</button>
      ) : (
        <form className="row g8 wrap" onSubmit={(e) => { e.preventDefault(); send(); }} aria-label={t('wax.sendTitle', { name })}>
          <input className="input grow" style={{ minWidth: '11rem', height: '2.25rem' }} type="tel" inputMode="tel" autoComplete="off"
            placeholder={t('wax.phonePh')} aria-label={t('wax.phonePh')} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{t('wax.sendBtn')}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>{t('common.cancel')}</button>
          <span className="t-xs t-mute" style={{ flexBasis: '100%' }}>{t('wax.phoneKeep')}</span>
        </form>
      )}
      {msg && <SentNote r={msg} />}
    </div>
  );
}
