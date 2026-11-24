import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';

type Item = { id: string; from: string; subject: string; reason: 'unknown' | 'unverified' | 'no_brand'; at: string | null };
type Status = { ready: boolean; connected: boolean; email: string | null; address: string; lastCheckAt: string | null; filed: number; inbox: Item[] };

/** NickMark only: requests by email (the mailbox, the address clients write to, and senders no brand knows). */
export function MailChannel() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const [st, setSt] = useState<Status | null>(null);
  const [address, setAddress] = useState('');
  const [msg, setMsg] = useState<string | null>(params.get('correo') === 'ok' ? t('mail.connectedOk') : params.get('correo') === 'error' ? t('mail.error') : null);

  const load = () => api<Status>('/v1/admin/mail').then((s) => { setSt(s); setAddress(s.address); }).catch(() => setSt(null));
  useEffect(() => { load(); }, []);

  async function connect() {
    try { window.location.href = (await api<{ url: string }>('/v1/admin/mail/connect', { method: 'POST', body: '{}' })).url; } catch { setMsg(t('mail.error')); }
  }
  async function save() {
    try { await api('/v1/admin/mail/address', { method: 'PUT', body: JSON.stringify({ address }) }); setMsg(t('mail.saved')); load(); } catch { setMsg(t('mail.badAddress')); }
  }
  async function dismiss(id: string) { await api(`/v1/admin/mail/inbox/${id}/dismiss`, { method: 'POST', body: '{}' }).catch(() => null); load(); }
  const chip = (on: boolean) => <span className={`chip ${on ? 'c-active' : 'c-draft'}`}>{on ? t('wa.on') : t('wa.off')}</span>;

  return (
    <section className="card col g12" aria-labelledby="h-mail">
      <div className="col"><h2 className="h3" id="h-mail">{t('mail.title')}</h2><span className="t-xs t-mute">{t('mail.sub')}</span></div>
      {st && (
        <div className="row g16 wrap t-sm">
          <span className="row g8">{t('mail.mailbox')} {chip(st.connected)}</span>
          {st.email && <span className="t-mute">{st.email}</span>}
          <span className="t-mute">{t('mail.lastCheck')}: {st.lastCheckAt ? new Date(st.lastCheckAt).toLocaleString() : t('wa.never')}</span>
          <span className="t-mute">{t('mail.filed')}: {st.filed}</span>
        </div>
      )}
      {st && !st.ready && <p className="t-sm t-mute">{t('mail.notReady')}</p>}
      {st?.ready && <div className="row g8 wrap"><button className={`btn btn-sm ${st.connected ? 'btn-ghost' : 'btn-primary'}`} onClick={connect}>{st.connected ? t('mail.reconnect') : t('mail.connect')}</button></div>}
      <label className="col g4 t-sm">
        <span>{t('mail.address')}</span>
        <div className="row g8 wrap">
          <input className="input" style={{ height: '2.25rem', maxWidth: '20rem' }} type="email" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="pedidos@braindy.co" />
          <button className="btn btn-primary btn-sm" onClick={save}>{t('mywa.save')}</button>
        </div>
        <span className="t-xs t-mute">{t('mail.addressHint')}</span>
      </label>
      {msg && <p className="t-sm" role="status">{msg}</p>}
      {st?.inbox.length ? <h3 className="t-sm"><b>{t('mail.unknownTitle')}</b></h3> : null}
      {st?.inbox.map((i) => (
        <div key={i.id} className="row g8 wrap" style={{ borderTop: '1px solid var(--line)', paddingTop: '0.625rem', justifyContent: 'space-between' }}>
          <span className="t-sm"><b>{i.from}</b> <span className="t-mute">· {i.subject || '—'} · {t(`mail.reason.${i.reason}`)}{i.at ? ` · ${new Date(i.at).toLocaleString()}` : ''}</span></span>
          <button className="btn btn-ghost btn-sm" onClick={() => dismiss(i.id)}>{t('wa.dismiss')}</button>
        </div>
      ))}
    </section>
  );
}
