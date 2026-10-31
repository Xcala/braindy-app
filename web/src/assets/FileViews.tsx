import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { formatBytes } from './fileApi';
import { extLabel, kindOf, thumbClass, type FileItem } from './fileKinds';

const date = (ms?: number, lang = 'en') =>
  ms ? new Date(ms).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export function FileGrid({ files, thumbs, onOpen }: { files: FileItem[]; thumbs: Record<string, string>; onOpen: (f: FileItem) => void }) {
  const { lang } = useI18n();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {files.map((f) => {
        const kind = kindOf(f);
        const thumb = thumbs[f.id];
        return (
          <button key={f.id} type="button" className="tile text-left" style={{ cursor: 'pointer', padding: 0 }} onClick={() => onOpen(f)}>
            <div className={`thumb ${thumb ? '' : thumbClass[kind]}`} style={{ height: 180, overflow: 'hidden', width: '100%' }}>
              {thumb ? (
                <img className="cover h-full w-full object-cover" src={thumb} alt="" loading="lazy" />
              ) : (
                <Icon name={kind === 'video' ? 'external' : kind === 'image' ? 'grid' : 'file'} size={40} className="ico" />
              )}
              <span className="chip chip-plain c-type badge" style={{ background: '#fff', zIndex: 1 }}>{extLabel(f)}</span>
            </div>
            <div className="tile-meta w-full">
              <span className="tile-name">{f.title}</span>
              <span className="t-sm t-mute">{formatBytes(f.size)}{f.mtimeMs ? ` · ${date(f.mtimeMs, lang)}` : ''}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function FileList({ files, onOpen, onDownload }: { files: FileItem[]; onOpen: (f: FileItem) => void; onDownload: (f: FileItem) => void }) {
  const { t, lang } = useI18n();
  return (
    <div className="list overflow-x-auto">
      <div className="lrow head label min-w-[640px]"><span>{t('files.name')}</span><span>{t('files.type')}</span><span>{t('files.size')}</span><span>{t('files.modified')}</span><span /></div>
      {files.map((f) => (
        <div key={f.id} className="lrow min-w-[640px]">
          <button type="button" onClick={() => onOpen(f)} className="truncate text-left w7" style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)' }}>{f.title}</button>
          <span><span className="chip chip-plain c-type">{extLabel(f)}</span></span>
          <span className="t-sm t-mute">{formatBytes(f.size)}</span>
          <span className="t-sm t-mute">{date(f.mtimeMs, lang)}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDownload(f)} aria-label={`${t('common.download')} ${f.title}`}>
            <Icon name="download" size={16} />
          </button>
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
      style={{ border: `1px solid ${on ? '#B9E5CC' : 'var(--line)'}`, background: on ? '#EAF7EF' : '#fff', color: on ? '#0E5A3A' : 'var(--mute, #6B7280)', borderRadius: 999, padding: '4px 8px 4px 4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <span aria-hidden="true" style={{ width: 26, height: 16, borderRadius: 999, background: on ? '#1F9D5C' : '#CBD2DC', position: 'relative', transition: 'background .2s', flex: 'none' }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 12 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
      </span>
      {t(on ? 'fa.on' : 'fa.off')}
    </button>
  );
}

export function FolderGrid({ folders, onOpen }: { folders: Array<{ path: string; files: number; bytes: number; highlight?: boolean; hidden?: boolean; toggle?: () => void }>; onOpen: (p: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {folders.map((f) => (
        <div key={f.path} className="relative">
        <button type="button" className="folder w-full text-left" onClick={() => onOpen(f.path)}
          style={{ cursor: 'pointer', ...(f.highlight ? { borderColor: 'var(--azul)', background: '#F7F9FF' } : {}), ...(f.hidden ? { opacity: 0.55, borderStyle: 'dashed' } : {}) }}>
          <span className="fi" style={f.highlight ? { background: 'var(--azul)', color: '#fff' } : undefined}>
            <Icon name={f.highlight ? 'upload' : 'folder'} size={22} />
          </span>
          <span className="col grow" style={{ minWidth: 0 }}>
            <span className="w7 truncate">{f.path.slice(f.path.lastIndexOf('/') + 1)}</span>
            <span className="t-sm t-mute">{f.highlight ? t('files.uploadsHint') : `${formatBytes(f.bytes)}`}{f.hidden && !f.toggle ? ` · ${t('fa.hiddenTag')}` : ''}</span>
          </span>
        </button>
        {f.toggle && <span className="absolute" style={{ right: 12, bottom: 12 }}><ShareSwitch on={!f.hidden} label={f.path} onToggle={f.toggle} /></span>}
        </div>
      ))}
    </div>
  );
}
