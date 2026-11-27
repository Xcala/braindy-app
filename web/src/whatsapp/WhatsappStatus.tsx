import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { ago } from './format';
import { LoadFail } from './LoadFail';

type Status = {
  sending: boolean; receiving: boolean; lastWebhookAt: string | null; inbound: number;
  lastError: { code: number | null; title: string; at: string | null } | null;
};

// An error newer than this turns the line red.
const RECENT_MS = 24 * 3600 * 1000;

/** The channel's state in one line: green when it receives and sends, red with what happened when not. «Ver» opens the details. */
export function WhatsappStatus() {
  const { t } = useI18n();
  const [st, setSt] = useState<Status | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const load = useCallback(() => {
    setFailed(false);
    api<Status>('/v1/admin/whatsapp/status').then(setSt, () => setFailed(true));
  }, []);
  useEffect(load, [load]);

  if (failed) return <LoadFail onRetry={load} />;
  if (!st) return <div className="skel" style={{ height: '1.5rem', maxWidth: '20rem' }} />;

  const errAt = st.lastError?.at ? new Date(st.lastError.at) : null;
  const recentError = !!errAt && Date.now() - errAt.getTime() < RECENT_MS;
  const bad = !st.receiving || !st.sending || recentError;
  const signal = st.lastWebhookAt ? new Date(st.lastWebhookAt) : null;
  const text = !st.receiving ? t('wa.badReceive')
    : !st.sending ? t('wa.badSend')
    : recentError ? t('wa.badError', { what: st.lastError!.title || String(st.lastError!.code ?? ''), ago: ago(errAt!, t) })
    : signal ? t('wa.okLine', { ago: ago(signal, t) }) : t('wa.okNoSignal');

  return (
    <div className="col g4">
      <p className={`wa-status t-sm ${bad ? 'is-bad' : 'is-ok'}`} role={bad ? 'alert' : 'status'}>
        <span aria-hidden="true">{bad ? '!' : '✓'}</span> {text}
        {' '}<button type="button" className="wa-link" aria-expanded={open} onClick={() => setOpen(!open)}>{t('wa.details')}</button>
      </p>
      {open && (
        <p className="t-xs t-mute" style={{ margin: 0 }}>
          {t('wa.receiving')}: {t(st.receiving ? 'wa.on' : 'wa.off')} · {t('wa.sending')}: {t(st.sending ? 'wa.on' : 'wa.off')}
          {' · '}{t('wa.lastWebhook')}: {signal ? signal.toLocaleString() : t('wa.never')} · {t('wa.inbound')}: {st.inbound}
          {st.lastError && <> · {t('wa.lastError')}: {st.lastError.code ?? ''} {st.lastError.title}{errAt ? ` (${errAt.toLocaleString()})` : ''}</>}
        </p>
      )}
    </div>
  );
}
