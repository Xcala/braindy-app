import type { CSSProperties, ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { formatBytes } from './fileApi';
import { APPROVED } from './folderRules';
import { extLabel, kindOf, thumbClass, type FileItem } from './fileKinds';

const date = (ms?: number, lang = 'en') =>
  ms ? new Date(ms).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

/** NickMark only: pin a file to the brand documents in My brand. */
export type Pin = { on: (id: string) => boolean; toggle: (f: FileItem) => void };
/** Files ticked for a bulk action (.zip for everyone; move and trash for NickMark). */
export type Sel = { on: (id: string) => boolean; toggle: (id: string, range?: boolean) => void };

function Check({ sel, f, style }: { sel: Sel; f: FileItem; style?: CSSProperties }) {
  const { t } = useI18n();
  return (
    <label className="fx-check" style={style} onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={sel.on(f.id)} onChange={(e) => sel.toggle(f.id, (e.nativeEvent as MouseEvent).shiftKey)} aria-label={`${t('files.select')} ${f.title}`} />
    </label>
  );
}

function PinButton({ pin, f, style }: { pin: Pin; f: FileItem; style?: CSSProperties }) {
  const { t } = useI18n();
  const on = pin.on(f.id);
  return (
    <button type="button" aria-pressed={on} title={t(on ? 'bf.unpin' : 'bf.pin')} onClick={(e) => { e.stopPropagation(); pin.toggle(f); }} className={`fx-pin${on ? ' is-on' : ''}`} style={style}>
      {on ? `✓ ${t('bf.pinned')}` : `+ ${t('bf.pin')}`}
    </button>
  );
}

type Menu = (f: FileItem, style?: CSSProperties) => ReactNode;

export function FileGrid({ files, thumbs, onOpen, pin, menu, sel }: { files: FileItem[]; thumbs: Record<string, string>; onOpen: (f: FileItem) => void; pin?: Pin; menu?: Menu; sel?: Sel }) {
  const { t, lang } = useI18n();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {files.map((f) => {
        const kind = kindOf(f);
        const thumb = thumbs[f.id];
        return (
          <div key={f.id} className={`tile${sel?.on(f.id) ? ' is-picked' : ''}`} style={{ padding: 0, position: 'relative' }}>
          <button type="button" className="text-left" style={{ cursor: 'pointer', padding: 0, border: 0, background: 'none', width: '100%' }} onClick={() => onOpen(f)}>
            <div className={`thumb ${thumb ? '' : thumbClass[kind]}`} style={{ height: '11.25rem', overflow: 'hidden', width: '100%' }}>
              {thumb ? (
                <img className="cover h-full w-full object-cover" src={thumb} alt="" loading="lazy" />
              ) : (
                <Icon name={kind === 'video' ? 'external' : kind === 'image' ? 'grid' : 'file'} size={40} className="ico" />
              )}
              <span className="chip chip-plain c-type badge" style={{ background: 'var(--white)', zIndex: 1 }}>{extLabel(f)}</span>
            </div>
            <div className="tile-meta w-full">
              <span className="tile-name">{f.title}</span>
              {f.why === 'ai' && <span className="t-xs fx-why" title={f.ai?.summary}><Icon name="spark" size={12} />{t('ss.why')}</span>}
              <span className="t-sm t-mute">{formatBytes(f.size)}{f.mtimeMs ? ` · ${date(f.mtimeMs, lang)}` : ''}</span>
            </div>
          </button>
          {pin && <PinButton pin={pin} f={f} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 2 }} />}
          {menu?.(f, { position: 'absolute', top: 136, right: 12, zIndex: 3 })}
          {sel && <Check sel={sel} f={f} style={{ position: 'absolute', top: '8.5rem', left: '0.75rem', zIndex: 2 }} />}
          </div>
        );
      })}
    </div>
  );
}

/** `onFolder` (search across all folders) shows each file's folder under its name, as a link to open it. */
export function FileList({ files, onOpen, onDownload, pin, menu, sel, onFolder }: { files: FileItem[]; onOpen: (f: FileItem) => void; onDownload: (f: FileItem) => void; pin?: Pin; menu?: Menu; sel?: Sel; onFolder?: (folder: string) => void }) {
  const { t, lang } = useI18n();
  return (
    <div className="list overflow-x-auto">
      <div className={`lrow head label min-w-[40rem]${pin ? ' has-pin' : ''}`}><span>{t('files.name')}</span><span>{t('files.type')}</span><span>{t('files.size')}</span><span>{t('files.modified')}</span><span /></div>
      {files.map((f) => (
        <div key={f.id} className={`lrow min-w-[40rem]${pin ? ' has-pin' : ''}${sel?.on(f.id) ? ' is-picked' : ''}`}>
          <span className="row g10" style={{ minWidth: 0 }}>{sel && <Check sel={sel} f={f} />}<span className="col" style={{ minWidth: 0 }}><button type="button" onClick={() => onOpen(f)} className="truncate text-left w7" style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)' }}>{f.title}</button>
            {f.why === 'ai' && <span className="t-xs fx-why" title={f.ai?.summary}><Icon name="spark" size={12} />{t('ss.why')}</span>}
            {onFolder && <button type="button" className="t-xs t-mute truncate text-left" style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }} onClick={() => onFolder(f.folder ?? '')}><Icon name="folder" size={12} /> {f.folder || t('files.rootFolder')}</button>}</span></span>
          <span><span className="chip chip-plain c-type">{extLabel(f)}</span></span>
          <span className="t-sm t-mute">{formatBytes(f.size)}</span>
          <span className="t-sm t-mute">{date(f.mtimeMs, lang)}</span>
          <span className="row g4" style={{ justifyContent: 'flex-end' }}>
          {pin && <PinButton pin={pin} f={f} />}
          <button type="button" className="fx-ibtn" onClick={() => onDownload(f)} aria-label={`${t('common.download')} ${f.title}`}>
            <Icon name="download" size={16} />
          </button>
          {menu?.(f)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** NickMark only: whether the client sees a folder. A small labelled switch, keyboard and screen-reader friendly. */
export function ShareSwitch({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  const { t } = useI18n();
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={t('fa.toggleLabel', { name: label })} title={t(on ? 'fa.onHint' : 'fa.offHint')}
      onClick={(e) => { e.stopPropagation(); onToggle(); }} className="row g6 t-xs w7"
      style={{ border: `1px solid ${on ? '#B9E5CC' : 'var(--line)'}`, background: on ? '#EAF7EF' : '#fff', color: on ? '#0E5A3A' : 'var(--mute, #6B7280)', borderRadius: '62.4375rem', padding: '0.25rem 0.625rem 0.25rem 0.3125rem', gap: '0.4375rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <span aria-hidden="true" style={{ width: '1.625rem', height: '1rem', borderRadius: '62.4375rem', background: on ? '#1F9D5C' : '#CBD2DC', position: 'relative', transition: 'background .2s', flex: 'none' }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 12 : 2, width: '0.75rem', height: '0.75rem', borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
      </span>
      {t(on ? 'fa.on' : 'fa.off')}
    </button>
  );
}

export function FolderGrid({ folders, onOpen, menu }: { folders: Array<{ path: string; files: number; bytes: number; highlight?: boolean; hidden?: boolean; toggle?: () => void }>; onOpen: (p: string) => void; menu?: (path: string) => ReactNode }) {
  const { t } = useI18n();
  return (
    // As many columns as fit with room for the name, the ⋯ menu and the client switch.
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 14.375rem), 1fr))' }}>
      {folders.map((f) => (
        <div key={f.path} className={`folder fcard${f.toggle ? " has-switch" : ""}`}
          style={{ ...(f.highlight ? { borderColor: 'var(--azul)', background: 'var(--hielo)' } : {}), ...(f.hidden ? { borderStyle: 'dashed' } : {}) }}>
          <div className="row" style={{ gap: '0.25rem', minWidth: 0, flex: '1 1 auto' }}>
          <button type="button" className="fopen" onClick={() => onOpen(f.path)} style={f.hidden ? { opacity: 0.55 } : undefined}>
            <span className="fi" style={f.highlight ? { background: 'var(--azul-fill)', color: '#fff' } : undefined}>
              <Icon name={f.highlight ? 'upload' : 'folder'} size={22} />
            </span>
            <span className="col grow" style={{ minWidth: 0 }}>
              <span className="w7 fname">{f.highlight ? t('files.uploadsName') : f.path === APPROVED ? t('files.approvedName') : f.path.slice(f.path.lastIndexOf('/') + 1)}</span>
              <span className="t-sm t-mute truncate">{f.highlight ? t('files.uploadsHint') : `${formatBytes(f.bytes)}`}{f.hidden && !f.toggle ? ` · ${t('fa.hiddenTag')}` : ''}</span>
            </span>
          </button>
          {menu && !f.highlight && menu(f.path)}
          </div>
          {f.toggle && <ShareSwitch on={!f.hidden} label={f.path} onToggle={f.toggle} />}
        </div>
      ))}
    </div>
  );
}
