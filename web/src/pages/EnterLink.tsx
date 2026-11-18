import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { AuthLayout } from '../components/AuthLayout';
import { enterWithLink, useBraindyNumber, waChat } from '../auth/whatsappAccess';

/** /entrar/:token — the one-time link sent by WhatsApp: signs the person in and opens Today. */
export function EnterLink() {
  const { token = '' } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const number = useBraindyNumber();
  const [state, setState] = useState<'working' | 'done' | 'used' | 'expired' | 'invalid'>('working');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    enterWithLink(token).then(() => setState('done'), (e: { status?: number; body?: { error?: string } }) =>
      setState(e?.body?.error === 'used' ? 'used' : e?.body?.error === 'expired' ? 'expired' : 'invalid'));
  }, [token]);

  if (state === 'done' && user) return <Navigate to="/home" replace />;
  return (
    <AuthLayout>
      <div className="col g24 w-full max-w-[26.25rem]" role="status">
        {state === 'working' || state === 'done' ? <p className="h3">{t('wax.entering')}</p> : <>
          <div className="col g8">
            <h2 className="h2">{t(`wax.${state}`)}</h2>
            <p className="t-mute">{t('wax.again')}</p>
          </div>
          {number && <a className="btn btn-primary btn-block" style={{ height: '3.25rem' }} href={waChat(number, t('wax.loginText'))} target="_blank" rel="noreferrer">{t('wax.askNew')}</a>}
          <Link to="/login" className="t-sm w7 text-center">{t('wax.toLogin')}</Link>
        </>}
      </div>
    </AuthLayout>
  );
}
