import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';

/** Settings · My WhatsApp: the person's own number (with consent). Messages from it become requests. */
export function MyWhatsappCard() {
  const { t } = useI18n();
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ phone: string; optIn: boolean }>('/v1/me/whatsapp').then((r) => { setPhone(r.phone); setSaved(r.phone); setOptIn(r.optIn); }).catch(() => null);
  }, []);

  async function save(remove = false) {
    if (!remove && !optIn) { setMsg({ ok: false, text: t('mywa.needConsent') }); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await api<{ phone?: string }>('/v1/me/whatsapp', { method: 'PUT', body: JSON.stringify(remove ? {} : { phone, optIn }) });
      const p = remove ? '' : r.phone ?? phone;
      setPhone(p); setSaved(p); if (remove) setOptIn(false);
      setMsg({ ok: true, text: t(remove ? 'mywa.removed' : 'mywa.saved') });
    } catch (e) {
      const s = String(e);
      setMsg({ ok: false, text: t(s.includes('409') ? 'mywa.taken' : s.includes('400') ? 'mywa.bad' : 'mywa.error') });
    } finally { setBusy(false); }
  }

  return (
    <div className="card col g16" aria-labelledby="h-mywa">
      <div className="row between g8 wrap">
        <span className="row g8 wrap min-w-0">
          <h2 className="h3" id="h-mywa">{t('mywa.title')}</h2>
          <span className={`chip ${saved ? 'c-active' : 'c-draft'}`}>{saved ? t('set.connected') : t('set.notConnected')}</span>
        </span>
      </div>
      <p className="t-sm t-mute" style={{ margin: 0 }}>{t('mywa.sub')}</p>
      <div className="field">
        <label htmlFor="mywa-num">{t('mywa.number')}</label>
        <input id="mywa-num" className="input" inputMode="tel" placeholder="+57 300 000 0000" value={phone} onChange={(e) => { setPhone(e.target.value); setMsg(null); }} />
      </div>
      <label className="row g8 t-sm" style={{ alignItems: 'flex-start' }}>
        <input type="checkbox" checked={optIn} onChange={(e) => { setOptIn(e.target.checked); setMsg(null); }} style={{ marginTop: '0.1875rem' }} />
        <span>{t('mywa.consent')}</span>
      </label>
      <div className="row g8 wrap">
        <button type="button" className="btn btn-primary btn-sm" disabled={busy || !phone.trim()} onClick={() => save()}>{t('mywa.save')}</button>
        {saved && <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => save(true)}>{t('mywa.remove')}</button>}
      </div>
      {msg && <p className="t-sm" role="status" style={{ margin: 0, color: msg.ok ? undefined : 'var(--danger)' }}>{msg.text}</p>}
    </div>
  );
}
