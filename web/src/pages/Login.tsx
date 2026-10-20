import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { AuthLayout } from '../components/AuthLayout';
import { GoogleIcon } from '../components/Icon';

export function Login() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
    } catch {
      setMessage({ kind: 'error', text: t('login.error') });
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(() => signInWithEmailAndPassword(auth, email, password));
  }

  async function forgot() {
    if (!email) { setMessage({ kind: 'error', text: t('login.forgotNeedsEmail') }); return; }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch { /* do not reveal whether the account exists */ }
    setMessage({ kind: 'info', text: t('login.forgotSent') });
  }

  return (
    <AuthLayout>
      <form onSubmit={onSubmit} className="col g24 w-full max-w-[420px]">
        <div className="col" style={{ gap: 10 }}>
          <h2 className="h1">{t('login.title1')}<span className="w9">ai</span>{t('login.title2')}</h2>
          <p className="t-mute">{t('login.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-google btn-block" style={{ height: 52 }} disabled={busy}
          onClick={() => run(() => signInWithPopup(auth, googleProvider))}>
          <GoogleIcon />
          {t('login.google')}
        </button>
        <div className="row g16">
          <div className="divider" style={{ flex: "1 1 auto", width: "auto" }} />
          <span className="t-sm t-mute">{t('login.orEmail')}</span>
          <div className="divider" style={{ flex: "1 1 auto", width: "auto" }} />
        </div>
        <div className="field">
          <label htmlFor="em">{t('login.email')}</label>
          <input className="input" id="em" type="email" required autoComplete="email"
            placeholder="you@yourcompany.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <div className="row between" style={{ alignItems: 'baseline' }}>
            <label htmlFor="pw">{t('login.password')}</label>
            <button type="button" onClick={forgot} className="t-sm w7" style={{ background: 'none', border: 0, color: 'var(--azul)', cursor: 'pointer', padding: 0 }}>
              {t('login.forgot')}
            </button>
          </div>
          <input className="input" id="pw" type="password" required autoComplete="current-password"
            placeholder={t('login.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {message && (
          <p role={message.kind === 'error' ? 'alert' : 'status'} className="t-sm"
            style={{ color: message.kind === 'error' ? 'var(--danger)' : 'var(--success)' }}>
            {message.text}
          </p>
        )}
        <button className="btn btn-primary btn-block" type="submit" style={{ height: 52 }} disabled={busy}>
          {t('login.submit')}
        </button>
        <p className="t-sm t-mute text-center">
          {t('login.invite')} <a href="mailto:nicolas@braindy.co" className="w7">{t('login.writeNicolas')}</a>
        </p>
      </form>
    </AuthLayout>
  );
}
