import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';

type Item = { k: string; icon: string };
const ITEMS: Item[] = [
  { k: 'requests', icon: '📋' }, { k: 'ask', icon: '✍️' }, { k: 'approve', icon: '✅' }, { k: 'site', icon: '🌐' },
  { k: 'files', icon: '🗂️' }, { k: 'social', icon: '📅' }, { k: 'nico', icon: '💬' },
];

/**
 * The assistant's name in the panel header, with «Beta». Resting the pointer on it (or tapping it, or focusing it with the
 * keyboard) opens «What the assistant can help you with»: one line per thing it does; picking one asks it right away.
 */
export function CapabilitiesMenu({ admin, onAsk, id, className }: { admin: boolean; onAsk: (q: string) => void; id: string; className: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  // Fixed to the screen, placed under the name: the panel header clips anything that overflows it.
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const timer = useRef<number>(0);
  const items = admin ? [{ k: 'all', icon: '🧭' }, ...ITEMS] : ITEMS;
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc, true);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc, true); };
  }, [open]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open || !box.current) return;
    const r = box.current.getBoundingClientRect();
    setAt({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left - 8, window.innerWidth - 360)) });
  }, [open]);
  // A short delay on leaving, so the pointer can travel from the name to the list without it closing.
  const enter = (e: React.PointerEvent) => { if (e.pointerType !== 'mouse') return; window.clearTimeout(timer.current); setOpen(true); };
  const leave = (e: React.PointerEvent) => { if (e.pointerType !== 'mouse') return; timer.current = window.setTimeout(() => setOpen(false), 180); };

  return (
    <div ref={box} className="cap-wrap" onPointerEnter={enter} onPointerLeave={leave}>
      <h2 id={id} className={className}>
        <button type="button" className="cap-name" aria-expanded={open} aria-controls={`${id}-caps`} onClick={() => setOpen((o) => !o)}>
          {t('help.dock')}
        </button>
        <span className="help-beta">{t('help.beta')}</span>
      </h2>
      {open && at && (
        <div style={{ top: at.top, left: at.left }} id={`${id}-caps`} className="cap-pop" role="menu" aria-label={t('cap.title')}>
          <p className="cap-head">{t('cap.title')}</p>
          {items.map((it) => (
            <button key={it.k} type="button" role="menuitem" className="cap-item" onClick={() => { setOpen(false); onAsk(t(`cap.${it.k}.q` as StringKey)); }}>
              <span className="cap-ico" aria-hidden="true">{it.icon}</span>
              <span className="cap-txt"><b>{t(`cap.${it.k}` as StringKey)}</b><span>{t(`cap.${it.k}.d` as StringKey)}</span></span>
              <span className="cap-go" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
