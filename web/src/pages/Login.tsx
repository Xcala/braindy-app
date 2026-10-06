import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../auth/AuthProvider';
import { FullScreenMessage } from '../components/FullScreenMessage';

export function Login() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch {
      setError('We could not sign you in. Check your details and try again.');
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(() => signInWithEmailAndPassword(auth, email, password));
  }

  return (
    <FullScreenMessage title="Sign in">
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          disabled={busy}
          onClick={() => run(() => signInWithPopup(auth, googleProvider))}
          className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Continue with Google
        </button>
        <div className="text-xs text-black/40">or</div>
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <input
            type="email" required autoComplete="email" placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
          />
          <input
            type="password" required autoComplete="current-password" placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit" disabled={busy}
            className="rounded-full border border-black/15 px-4 py-2.5 text-sm font-medium hover:bg-black/5 disabled:opacity-50"
          >
            Sign in with email
          </button>
        </form>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
    </FullScreenMessage>
  );
}
