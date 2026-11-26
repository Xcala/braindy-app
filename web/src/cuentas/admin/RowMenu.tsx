import { useEffect, useRef, useState } from 'react';

export type MenuItem = { key: string; label: string; onClick: () => void; danger?: boolean; disabled?: boolean };

/** «⋯» on a row: the actions that are not the main one (mark paid, mora, schedule, void). Void goes last, in red.
 *  Closes on Escape, on a click outside and after choosing; arrow keys move between items. */
export function RowMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const out = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', out);
    box.current?.querySelector<HTMLButtonElement>('[role=menuitem]:not(:disabled)')?.focus();
    return () => document.removeEventListener('mousedown', out);
  }, [open]);
  if (!items.length) return null;
  const move = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const list = [...(box.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]:not(:disabled)') ?? [])];
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length]?.focus();
  };
  return (
    <div className="cc-menu" ref={box} onKeyDown={move}>
      <button ref={btn} type="button" className="btn btn-ghost btn-sm cc-menu-btn" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>⋯</button>
      {open && (
        <div className="cc-menu-pop" role="menu" aria-label={label}>
          {items.map((it) => (
            <button key={it.key} type="button" role="menuitem" className={`cc-menu-item${it.danger ? ' is-danger' : ''}`} disabled={it.disabled}
              onClick={() => { setOpen(false); it.onClick(); }}>{it.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
