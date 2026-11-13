import { useEffect, useState, type ReactNode } from 'react';
import { useL } from './HostingParts';

const KEY = (id: string) => `braindy.plan.intro.${id}`;
const seen = (id: string) => { try { return localStorage.getItem(KEY(id)) === '1'; } catch { return false; } };

/** A Mi plan explainer shows open the first time a tab is visited; after that it folds into one line that opens it again. It can be folded any time. */
export function OnceIntro({ id, children }: { id: string; children: ReactNode }) {
  const L = useL();
  const [first] = useState(() => !seen(id));
  const [open, setOpen] = useState(first);
  useEffect(() => { try { localStorage.setItem(KEY(id), '1'); } catch { /* private mode: it just shows open again */ } }, [id]);
  if (open) return (
    <div className="col g8">
      {children}
      <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} aria-expanded onClick={() => setOpen(false)}>{L(['▾ Ocultar explicación', '▾ Hide explanation'])}</button>
    </div>
  );
  return (
    <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} aria-expanded={false} onClick={() => setOpen(true)}>
      ▸ {L(['¿Cómo funciona esta sección?', 'How does this section work?'])}
    </button>
  );
}
