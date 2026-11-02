import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nProvider';
import { Icon, type IconName } from '../components/Icon';
import type { FileItem } from './fileKinds';
import type { FileActions } from './useFileActions';

/** NickMark only: the ⋯ menu of one file (rename, copy a 7-day link, move, trash). */
export function FileMenu({ f, actions, style }: { f: FileItem; actions: FileActions; style?: CSSProperties }) {
  const { t } = useI18n();
  // In a portal on <body>, fixed to the viewport: a tile's clipped corners or an animated page cannot cut or shift it.
  const [open, setOpen] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const box = useRef<HTMLSpanElement>(null);
  const pop = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node) && !pop.current?.contains(e.target as Node)) setOpen(null);
    };
    const close = () => setOpen(null);
    window.addEventListener('scroll', close, true);
    document.addEventListener('mousedown', off); document.addEventListener('keydown', off);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', off); window.removeEventListener('scroll', close, true); };
  }, [open]);
  const items: Array<[IconName, string, () => void, boolean?]> = [
    ['pencil', t('files.rename'), () => actions.rename(f)],
    ['link', t('files.share'), () => actions.share(f)],
    ['folder', t('files.move'), () => actions.setPicked(new Set([f.id]))],
    ['trash', t('files.toTrash'), () => window.confirm(t('files.deleteConfirm', { name: f.title })) && actions.trash([f.id]), true],
  ];
  return (
    <span ref={box} style={{ position: 'relative', ...style }} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="btn btn-ghost btn-sm" aria-haspopup="menu" aria-expanded={!!open} aria-label={`${t('files.more')} · ${f.title}`}
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); const right = document.documentElement.clientWidth - r.right;
          // Opens upward near the bottom of the window.
          setOpen((o) => (o ? null : r.bottom + 200 > window.innerHeight ? { bottom: window.innerHeight - r.top + 4, right } : { top: r.bottom + 4, right })); }} style={{ background: '#fff' }}>
        <Icon name="more" size={18} />
      </button>
      {open && createPortal(
        <span ref={pop} role="menu" className="fmenu" style={open}>
          {items.map(([icon, label, act, danger]) => (
            <button key={label} type="button" role="menuitem" onClick={() => { setOpen(null); act(); }} style={danger ? { color: 'var(--danger)' } : undefined}>
              <Icon name={icon} size={16} />{label}
            </button>
          ))}
        </span>, document.body,
      )}
    </span>
  );
}
