import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nProvider';
import { Icon, type IconName } from '../components/Icon';
import type { FileItem } from './fileKinds';
import type { FileActions } from './useFileActions';

type Item = [IconName, string, () => void, boolean?];

/** The ⋯ menu of one file: NickMark renames, copies a 7-day link, moves and trashes; a client only renames. */
export function FileMenu({ f, actions, style, admin = true }: { f: FileItem; actions: FileActions; style?: CSSProperties; admin?: boolean }) {
  const { t } = useI18n();
  const rename: Item = ['pencil', t('files.rename'), () => actions.setAsk({ kind: 'rename', f })];
  return <MoreMenu label={f.title} style={style} items={!admin ? [rename] : [
    rename,
    ['link', t('files.share'), () => actions.share(f)],
    ['folder', t('files.move'), () => actions.setPicked(new Set([f.id]))],
    ['trash', t('files.toTrash'), () => actions.setAsk({ kind: 'trash', ids: [f.id], name: f.title }), true],
  ]} />;
}

/** NickMark only: the ⋯ menu of one folder (rename, whole folder to the trash). Only Braindy changes, never Drive. */
export function FolderMenu({ path, actions, canRename }: { path: string; actions: FileActions; canRename: boolean }) {
  const { t } = useI18n();
  return <MoreMenu label={path.split('/').pop() ?? path} items={[
    ...(canRename ? [['pencil', t('files.rename'), () => actions.setAsk({ kind: 'renameFolder', path })] as Item] : []),
    ['trash', t('files.toTrash'), () => actions.setAsk({ kind: 'trashFolder', path }), true],
  ]} />;
}

function MoreMenu({ label, items, style }: { label: string; items: Item[]; style?: CSSProperties }) {
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
  return (
    <span ref={box} style={{ position: 'relative', ...style }} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="fx-ibtn" aria-haspopup="menu" aria-expanded={!!open} aria-label={`${t('files.more')} · ${label}`}
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); const right = document.documentElement.clientWidth - r.right;
          // Opens upward near the bottom of the window.
          setOpen((o) => (o ? null : r.bottom + 200 > window.innerHeight ? { bottom: window.innerHeight - r.top + 4, right } : { top: r.bottom + 4, right })); }}>
        <Icon name="more" size={18} />
      </button>
      {open && createPortal(
        <span ref={pop} role="menu" className="fmenu" style={open}>
          {items.map(([icon, text, act, danger]) => (
            <button key={text} type="button" role="menuitem" onClick={() => { setOpen(null); act(); }} style={danger ? { color: 'var(--danger)' } : undefined}>
              <Icon name={icon} size={16} />{text}
            </button>
          ))}
        </span>, document.body,
      )}
    </span>
  );
}
