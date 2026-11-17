import { useEffect, useRef } from 'react';
import type { Lang } from './I18nProvider';

/** Shown once when the browser speaks neither Spanish nor English: the person picks the app's language. Bilingual on purpose. */
export function LangChooser({ onPick }: { onPick: (l: Lang) => void }) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus(); }, []);
  return (
    <div className="scrim fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="h-lang" className="card col g16" style={{ maxWidth: '23.75rem', width: '100%', textAlign: 'center' }}>
        <img src="/brand/braindy-logo.svg" alt="Braindy" className="mx-auto h-7 w-auto" />
        <h2 className="h3" id="h-lang">Choose your language · Elige tu idioma</h2>
        <div className="grid grid-cols-2 gap-3">
          <button ref={first} type="button" className="btn btn-primary" onClick={() => onPick('en')} lang="en">English</button>
          <button type="button" className="btn btn-primary" onClick={() => onPick('es')} lang="es">Español</button>
        </div>
        <p className="t-xs t-mute">You can change it any time with EN / ES. · Puedes cambiarlo cuando quieras con EN / ES.</p>
      </div>
    </div>
  );
}
