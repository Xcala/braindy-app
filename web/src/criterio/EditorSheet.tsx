import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nProvider';
import type { L2 } from './useCriterio';
import './criterioAdmin.css';

/**
 * UX CR4: the lesson / objection editor as its own full-screen page (the router is shared, so a panel, not a route):
 * «‹» and the name on top, its state, an optional «View ›», the fields, and the buttons fixed at the bottom.
 */
export function EditorSheet({ title, meta, aside, foot, onClose, children }: {
  title: string; meta?: ReactNode; aside?: ReactNode; foot: ReactNode; onClose: () => void; children: ReactNode;
}) {
  const { t } = useI18n();
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    back.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.scrim')) onClose(); };
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', key); };
  }, [onClose]);
  return createPortal(
    <div className="acct-sheet cra-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="acct-sheet-bar">
        <span className="row g8" style={{ minWidth: 0 }}>
          <button ref={back} type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label={t('cra.back')}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <span className="cra-sheet-title"><span className="w7 truncate">{title}</span>{meta ? <span className="t-xs t-mute truncate">{meta}</span> : null}</span>
        </span>
        {aside}
      </div>
      <div className="acct-sheet-body col g16">{children}</div>
      <div className="cra-foot"><div className="cra-foot-in">{foot}</div></div>
    </div>,
    document.body,
  );
}

/** Spanish and English side by side for one text field. */
export function Bi({ label, value, onChange, rows = 1 }: { label: string; value: L2; onChange: (v: L2) => void; rows?: number }) {
  return (
    <div className="col g8">
      <span className="t-sm w7">{label}</span>
      <div className="grid gap-3 md:grid-cols-2">
        {(['es', 'en'] as const).map((k) => (
          rows > 1
            ? <textarea key={k} className="input" style={{ height: rows * 24 + 24, padding: '0.625rem 0.875rem', resize: 'vertical' }} aria-label={`${label} ${k}`} placeholder={k.toUpperCase()} value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })} />
            : <input key={k} className="input" aria-label={`${label} ${k}`} placeholder={k.toUpperCase()} value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })} />
        ))}
      </div>
    </div>
  );
}

/** Folded block for what rarely changes (UX CR4). */
export function Fold({ label, children }: { label: string; children: ReactNode }) {
  return <details className="cra-fold"><summary>{label}</summary><div className="col g16">{children}</div></details>;
}
