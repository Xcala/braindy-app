import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { AuthLayout } from '../components/AuthLayout';

/** Consent for the remote Braindy connector: Claude asks to act in Braindy App as NickMark. Admins only. */
export function Connect() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const req = params.get('req') ?? '';
  const [info, setInfo] = useState<{ clientName: string; redirectHost: string } | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'expired' | 'busy' | 'done'>('loading');

  useEffect(() => {
    if (!req) { setState('expired'); return; }
    api<{ clientName: string; redirectHost: string }>(`/v1/connector/requests/${encodeURIComponent(req)}`)
      .then((r) => { setInfo(r); setState('ready'); }).catch(() => setState('expired'));
  }, [req]);

  async function decide(decision: 'approve' | 'deny') {
    setState('busy');
    try {
      const { redirect } = await api<{ redirect: string }>(`/v1/connector/requests/${encodeURIComponent(req)}/${decision}`, { method: 'POST', body: '{}' });
      setState('done');
      window.location.assign(redirect);
    } catch { setState('expired'); }
  }

  const isAdmin = profile?.role === 'admin';
  return (
    <AuthLayout>
      <div className="col g16" style={{ maxWidth: 420 }}>
        <img src="/brand/braindy-logo.svg" alt="Braindy" style={{ height: 28, width: 'auto', alignSelf: 'flex-start' }} />
        {!isAdmin ? <p className="t-mute">{t('connect.adminOnly')}</p>
          : state === 'loading' ? <div className="skel" style={{ height: 120 }} />
          : state === 'expired' ? <p className="t-mute">{t('connect.expired')}</p>
          : state === 'done' ? <p className="t-mute">{t('connect.done')}</p>
          : (
            <>
              <h1 className="h2">{t('connect.title', { client: info?.clientName ?? 'Claude' })}</h1>
              <p className="t-sm t-mute">{t('connect.sub')}</p>
              <ul className="col g8 t-sm" style={{ paddingLeft: 18, listStyle: 'disc' }}>
                <li>{t('connect.can1')}</li><li>{t('connect.can2')}</li><li>{t('connect.can3')}</li>
              </ul>
              <p className="t-xs t-mute">{t('connect.never')}</p>
              <p className="t-xs t-mute">{t('connect.returnTo', { host: info?.redirectHost ?? '' })}</p>
              <div className="row g12">
                <button type="button" className="btn btn-primary" disabled={state === 'busy'} onClick={() => decide('approve')}>{t('connect.allow')}</button>
                <button type="button" className="btn btn-secondary" disabled={state === 'busy'} onClick={() => decide('deny')}>{t('common.cancel')}</button>
              </div>
            </>
          )}
      </div>
    </AuthLayout>
  );
}
