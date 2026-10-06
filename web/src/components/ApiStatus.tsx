import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type State = 'checking' | 'ok' | 'error';

/** Admin-only check that the browser → backend → Firestore path works with the user's token. */
export function ApiStatus() {
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    api<{ profile: unknown }>('/v1/me')
      .then((r) => setState(r.profile ? 'ok' : 'error'))
      .catch(() => setState('error'));
  }, []);

  const label = { checking: 'API…', ok: 'API ok', error: 'API error' }[state];
  const color = { checking: 'bg-black/30', ok: 'bg-emerald-500', error: 'bg-red-500' }[state];
  return (
    <span className="flex items-center gap-1.5 text-xs text-black/55" title="Backend connection">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
