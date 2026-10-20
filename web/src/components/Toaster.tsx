import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';

type ToastInput = { text: string; undo?: () => unknown; ms?: number; tone?: 'ok' | 'bad' };
type Toast = ToastInput & { id: number };
const Ctx = createContext<(t: ToastInput) => void>(() => undefined);

/** Toasts (design 30): undo instead of confirming reversible actions. 6 s, paused on hover/focus. */
export const useToast = () => useContext(Ctx);

export function Toaster({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const next = useRef(1);
  const show = useCallback((t: ToastInput) => setList((l) => [...l.slice(-2), { ...t, id: next.current++ }]), []);
  const close = useCallback((id: number) => setList((l) => l.filter((x) => x.id !== id)), []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6" role="status" aria-live="polite">
        {list.map((t) => <Item key={t.id} t={t} onClose={() => close(t.id)} />)}
      </div>
    </Ctx.Provider>
  );
}

function Item({ t, onClose }: { t: Toast; onClose: () => void }) {
  const { t: tr } = useI18n();
  const [paused, setPaused] = useState(false);
  const left = useRef(t.ms ?? (t.undo ? 6000 : 2000));
  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const id = window.setTimeout(onClose, left.current);
    return () => { window.clearTimeout(id); left.current -= Date.now() - started; };
  }, [paused, onClose]);
  return (
    <div className="toast pointer-events-auto w-full max-w-[420px]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <span className={t.tone === 'bad' ? 'bad' : 'ok'} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">{t.tone === 'bad' ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="m5 12 5 5 9-10" />}</svg>
      </span>
      <span className="grow">{t.text}</span>
      {t.undo && <a href="#" onClick={(e) => { e.preventDefault(); t.undo!(); onClose(); }}>{tr('common.undo')}</a>}
    </div>
  );
}
