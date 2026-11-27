import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { LoadFail } from './LoadFail';
import { shortWhen } from './format';

type Item = { id: string; from: string; subject: string; reason: 'unknown' | 'unverified' | 'no_brand'; at: string | null };
type Status = { ready: boolean; connected: boolean; email: string | null; address: string; lastCheckAt: string | null; filed: number; inbox: Item[] };

/** NickMark only: requests by email, as a one-line card (address · connected · requests filed); «Open» shows its setup. */
export function MailChannel() {
  const { t, lang } = useI18n();
  const [params] = useSearchParams();
  const back = params.get('correo');
  const [st, setSt] = useState<Status | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(!!back);
  const [address, setAddress] = useState('');
  const [msg, setMsg] = useState<string | null>(back === 'ok' ? t('mail.connectedOk') : back === 'error' ? t('mail.error') : null);

  const load = useCallback(() => {
    setFailed(false);
    api<Status>('/v1/admin/mail').then((s) => { setSt(s); setAddress(s.address); }, () => setFailed(true));
  }, []);
  useEffect(load, [load]);

  async function connect() {
    try { window.location.href = (await api<{ url: string }>('/v1/admin/mail/connect', { method: 'POST', body: '{}' })).url; } catch { setMsg(t('mail.error')); }
  }
  async function save() {
    try { await api('/v1/admin/mail/address', { method: 'PUT', body: JSON.stringify({ address }) }); setMsg(t('mail.saved')); load(); } catch { setMsg(t('mail.badAddress')); }
  }
  async function dismiss(id: string) { await api(`/v1/admin/mail/inbox/${id}/dismiss`, { method: 'POST', body: '{}' }).catch(() => null); load(); }

  const line = st ? [st.address || st.email || '—', t(st.connected ? 'mail.connected' : 'mail.disconnected'), t('mail.count', { n: st.filed }),
    st.inbox.length ? t('mail.review', { n: st.inbox.length }) : ''].filter(Boolean).join(' · ') : '';
  return (
    <section className="card col g12" aria-labelledby="h-mail">
      <div className="row g12" style={{ alignItems: 'center' }}>
        <div className="col grow" style={{ minWidth: 0 }}>
          <h2 className="w7 t-md" id="h-mail" style={{ margin: 0 }}>{t('mail.title')}</h2>
          {st && <span className={`t-xs ${st.connected ? 't-mute' : ''}`} style={st.connected ? undefined : { color: 'var(--danger)' }}>{line}</span>}
        </div>
        {st && <button type="button" className="btn btn-secondary btn-sm" aria-expanded={open} onClick={() => setOpen(!open)}>{t(open ? 'mail.hide' : 'mail.open')}</button>}
      </div>
      {failed && <LoadFail onRetry={load} />}
      {!st && !failed && <div className="skel" style={{ height: '1.5rem' }} />}
      {msg && <p className="t-sm" role="status" style={{ margin: 0 }}>{msg}</p>}
      {st && open && (
        <>
          <p className="t-xs t-mute" style={{ margin: 0 }}>{t('mail.sub')}</p>
          <span className="t-xs t-mute">{t('mail.lastCheck')}: {st.lastCheckAt ? shortWhen(new Date(st.lastCheckAt), lang, t) : t('wa.never')}</span>
          {!st.ready && <p className="t-sm t-mute" style={{ margin: 0 }}>{t('mail.notReady')}</p>}
          {st.ready && <div className="row g8 wrap"><button className={`btn btn-sm ${st.connected ? 'btn-ghost' : 'btn-primary'}`} onClick={connect}>{st.connected ? t('mail.reconnect') : t('mail.connect')}</button></div>}
          <label className="col g4 t-sm">
            <span>{t('mail.address')}</span>
            <div className="row g8 wrap">
              <input className="input" style={{ height: '2.25rem', maxWidth: '20rem' }} type="email" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="pedidos@braindy.co" />
              <button className="btn btn-primary btn-sm" onClick={save}>{t('mywa.save')}</button>
            </div>
            <span className="t-xs t-mute">{t('mail.addressHint')}</span>
          </label>
          {st.inbox.length ? <h3 className="t-sm" style={{ margin: 0 }}><b>{t('mail.unknownTitle')}</b></h3> : null}
          {st.inbox.map((i) => (
            <div key={i.id} className="row g8 wrap" style={{ borderTop: '1px solid var(--line)', paddingTop: '0.625rem', justifyContent: 'space-between' }}>
              <span className="t-sm"><b>{i.from}</b> <span className="t-mute">· {i.subject || '—'} · {t(`mail.reason.${i.reason}`)}{i.at ? ` · ${shortWhen(new Date(i.at), lang, t)}` : ''}</span></span>
              <button className="btn btn-ghost btn-sm" onClick={() => dismiss(i.id)}>{t('wa.dismiss')}</button>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
