import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { AuthLayout } from '../components/AuthLayout';
import { GoogleIcon } from '../components/Icon';
import { completeAccessLink, isAccessLink, rememberedEmail, sendAccessLink } from '../auth/emailLink';

/** Sign-in: Google, a one-time link by email (any inbox, no password) or, for those who have one, a password. */
export function Login() {
  const { user, loading } = useAuth();
  const { t, lang } = useI18n();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [withPassword, setWithPassword] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [fromLink] = useState(isAccessLink);
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Coming back from the emailed link: finish at once when this browser asked for it, otherwise confirm the email.
  useEffect(() => {
    if (!fromLink) return;
    const saved = rememberedEmail();
    if (saved) run(() => completeAccessLink(saved), 'login.linkError');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLink]);

  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  async function run(fn: () => Promise<unknown>, error: 'login.error' | 'login.linkError' = 'login.error') {
    setBusy(true);
    setMessage(null);
    try { await fn(); } catch { setMessage({ kind: 'error', text: t(error) }); } finally { setBusy(false); }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (fromLink) return run(() => completeAccessLink(email.trim()), 'login.linkError');
    if (withPassword) return run(() => signInWithEmailAndPassword(auth, email, password));
    run(async () => { await sendAccessLink(email.trim(), lang); setLinkSent(true); });
  }

  async function forgot() {
    if (!email) { setMessage({ kind: 'error', text: t('login.forgotNeedsEmail') }); return; }
    try { await sendPasswordResetEmail(auth, email); } catch { /* do not reveal whether the account exists */ }
    setMessage({ kind: 'info', text: t('login.forgotSent') });
  }

  const linkBtn = { background: 'none', border: 0, color: 'var(--azul)', cursor: 'pointer', padding: 0 } as const;
  return (
    <AuthLayout>
      <form onSubmit={onSubmit} className="col g24 w-full max-w-[26.25rem]">
        <div className="col" style={{ gap: '0.625rem' }}>
          <h2 className="h1">{t('login.title1')}<span className="w9">ai</span>{t('login.title2')}</h2>
          <p className="t-mute">{fromLink ? t('login.linkConfirm') : t('login.subtitle')}</p>
        </div>
        {linkSent ? (
          <div className="card col g8" role="status" style={{ background: '#EAF7EF', border: 0 }}>
            <span className="w7">{t('login.linkSentTitle')}</span>
            <span className="t-sm">{t('login.linkSent', { email })}</span>
            <button type="button" className="t-sm w7 self-start" style={linkBtn} onClick={() => setLinkSent(false)}>{t('login.linkOther')}</button>
          </div>
        ) : <>
          {!fromLink && <>
            <button type="button" className="btn btn-google btn-block" style={{ height: '3.25rem' }} disabled={busy}
              onClick={() => run(() => signInWithPopup(auth, googleProvider))}>
              <GoogleIcon />
              {t('login.google')}
            </button>
            <div className="row g16">
              <div className="divider" style={{ flex: '1 1 auto', width: 'auto' }} />
              <span className="t-sm t-mute">{t('login.orEmail')}</span>
              <div className="divider" style={{ flex: '1 1 auto', width: 'auto' }} />
            </div>
          </>}
          <div className="field">
            <label htmlFor="em">{t('login.email')}</label>
            <input className="input" id="em" type="email" required autoComplete="email"
              placeholder="you@yourcompany.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {withPassword && !fromLink && (
            <div className="field">
              <div className="row between" style={{ alignItems: 'baseline' }}>
                <label htmlFor="pw">{t('login.password')}</label>
                <button type="button" onClick={forgot} className="t-sm w7" style={linkBtn}>{t('login.forgot')}</button>
              </div>
              <input className="input" id="pw" type="password" required autoComplete="current-password"
                placeholder={t('login.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          {message && (
            <p role={message.kind === 'error' ? 'alert' : 'status'} className="t-sm" style={{ color: message.kind === 'error' ? 'var(--danger)' : 'var(--success)' }}>{message.text}</p>
          )}
          <button className="btn btn-primary btn-block" type="submit" style={{ height: '3.25rem' }} disabled={busy}>
            {fromLink ? t('login.linkFinish') : withPassword ? t('login.submit') : t('login.sendLink')}
          </button>
          {!fromLink && (
            <p className="t-sm t-mute text-center">
              {withPassword ? <button type="button" className="t-sm w7" style={linkBtn} onClick={() => setWithPassword(false)}>{t('login.useLink')}</button>
                : <>{t('login.linkHint')} <button type="button" className="t-sm w7" style={linkBtn} onClick={() => setWithPassword(true)}>{t('login.usePassword')}</button></>}
            </p>
          )}
        </>}
        <p className="t-sm t-mute text-center">
          {t('login.invite')} <a href="mailto:nicolas@braindy.co" className="w7">{t('login.writeNicolas')}</a>
        </p>
      </form>
    </AuthLayout>
  );
}
