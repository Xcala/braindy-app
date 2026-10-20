import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useCopy } from '../brands/identity/useCopy';
import { createSend } from './api';
import type { Proposal } from './types';

type Channel = 'link' | 'email' | 'whatsapp';

/** Send panel from the design: every send gets its own tracked link. Email needs Gmail (pending setup). */
export function SendPanel({ p }: { p: Proposal }) {
  const { t } = useI18n();
  const { copied, copy } = useCopy();
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [to, setTo] = useState(p.prospect?.phone ?? '');
  const greeting = p.prospect?.name ? p.prospect.name.split(' ')[0] : '';
  const [message, setMessage] = useState(t('proposals.defaultMessage', { name: greeting, company: p.prospect?.company ?? '' }));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ url: string; whatsapp: string | null } | null>(null);
  const [error, setError] = useState(false);

  const pick = (c: Channel) => {
    setChannel(c); setResult(null);
    setTo(c === 'whatsapp' ? p.prospect?.phone ?? '' : c === 'email' ? p.prospect?.email ?? '' : '');
  };

  async function send() {
    if (channel === 'email') return;
    setBusy(true); setError(false);
    try {
      const r = await createSend(p.id, channel, to, message);
      setResult(r);
      if (r.whatsapp) window.open(r.whatsapp, '_blank', 'noopener');
    } catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <aside className="card col g20" aria-labelledby="psend">
      <div className="col g4"><h2 className="h2" id="psend">{t('proposals.send')}</h2><p className="t-sm t-mute">{t('proposals.sendHint')}</p></div>
      <div className="seg" role="tablist" aria-label={t('proposals.channelLabel')} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {(['link', 'email', 'whatsapp'] as Channel[]).map((c) => (
          <button key={c} role="tab" aria-selected={channel === c} className={channel === c ? 'is-on' : ''} onClick={() => pick(c)}>
            <Icon name={c === 'link' ? 'link' : c === 'email' ? 'file' : 'external'} />{t(`proposals.channel.${c}`)}
          </button>
        ))}
      </div>
      {channel === 'email' ? (
        <div className="card card-tight col g8" style={{ background: 'var(--warning-bg)', border: 0 }}>
          <p className="w7" style={{ color: 'var(--warning)' }}>{t('proposals.emailPending')}</p>
          <p className="t-sm">{t('proposals.emailPendingBody')}</p>
        </div>
      ) : (
        <>
          {channel === 'whatsapp' && (
            <div className="field"><label htmlFor="to">{t('proposals.toPhone')}</label>
              <input className="input" id="to" type="tel" value={to} onChange={(e) => setTo(e.target.value)} placeholder="+57 300 000 0000" /></div>
          )}
          {channel === 'link' && (
            <div className="field"><label htmlFor="to">{t('proposals.linkFor')}</label>
              <input className="input" id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder={t('proposals.linkForPh')} /></div>
          )}
          {channel === 'whatsapp' && (
            <div className="field"><label htmlFor="msg">{t('proposals.message')}</label>
              <textarea id="msg" className="input" style={{ height: 160, padding: '14px 16px', lineHeight: '22px' }} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
          )}
          <button className="btn btn-primary btn-block" style={{ height: 52 }} onClick={send} disabled={busy || (channel === 'whatsapp' && to.replace(/\D/g, '').length < 8)}>
            {channel === 'whatsapp' ? t('proposals.openWhatsapp') : t('proposals.createLink')}
          </button>
          {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{t('proposals.sendError')}</p>}
          {result && (
            <div className="row g12" style={{ border: '1px solid var(--line)', borderRadius: 14, padding: '12px 14px' }}>
              <Icon name="link" size={20} />
              <span className="mono grow truncate">{result.url.replace(/^https?:\/\//, '')}</span>
              <button className="copybtn" onClick={() => copy(result.url)}>{copied === result.url ? t('common.copied') : t('common.copy')}</button>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
