import { useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useUploader } from './useUploader';

/** Upload button with its progress. Without `folder` files go to Uploads; NickMark can pass the open folder. */
export function UploadButton({ brandId, folder, label, secondary }: { brandId: string; folder?: string; label?: string; secondary?: boolean }) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const up = useUploader(brandId);
  const onFiles = async (list: FileList | null) => {
    await up.run(list, folder);
    if (input.current) input.current.value = '';
  };

  return (
    <div className="row g12 wrap">
      <UploadStatus up={up} />
      <input ref={input} type="file" multiple className="sr" onChange={(e) => onFiles(e.target.files)} aria-label={label ?? t('files.upload')} />
      <button className={`btn ${secondary ? 'btn-secondary btn-sm' : 'btn-primary'}`} onClick={() => input.current?.click()} disabled={up.progress !== null}>
        <Icon name="upload" size={secondary ? 14 : 18} />{label ?? t('files.upload')}
      </button>
    </div>
  );
}

export function UploadStatus({ up }: { up: ReturnType<typeof useUploader> }) {
  const { t } = useI18n();
  return (
    <>
      {up.state === 'error' && <span role="alert" className="t-sm" style={{ color: 'var(--danger)' }}>{t('files.uploadError')}</span>}
      {up.state === 'done' && <span role="status" className="t-sm" style={{ color: 'var(--success)' }}>{t('files.uploaded')}</span>}
      {up.progress !== null && (
        <span className="row g8 t-sm t-mute" aria-live="polite">
          <span className="block h-1.5 w-28 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
            <span className="block h-full" style={{ width: `${Math.round(up.progress * 100)}%`, background: 'var(--azul)' }} />
          </span>
          {Math.round(up.progress * 100)}%
        </span>
      )}
    </>
  );
}
