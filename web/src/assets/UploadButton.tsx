import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { upload } from './fileApi';

export function UploadButton({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle');

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setState('idle');
    try {
      for (const [i, f] of [...list].entries()) {
        await upload(brandId, f, (p) => setProgress((i + p) / list.length));
      }
      setState('done');
    } catch {
      setState('error');
    } finally {
      setProgress(null);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="row g12 wrap">
      {state === 'error' && <span role="alert" className="t-sm" style={{ color: 'var(--danger)' }}>{t('files.uploadError')}</span>}
      {state === 'done' && <span role="status" className="t-sm" style={{ color: 'var(--success)' }}>{t('files.uploaded')}</span>}
      {progress !== null && (
        <span className="row g8 t-sm t-mute" aria-live="polite">
          <span className="block h-1.5 w-28 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
            <span className="block h-full" style={{ width: `${Math.round(progress * 100)}%`, background: 'var(--azul)' }} />
          </span>
          {Math.round(progress * 100)}%
        </span>
      )}
      <input ref={input} type="file" multiple className="sr" onChange={(e) => onFiles(e.target.files)} aria-label={t('files.upload')} />
      <button className="btn btn-primary" onClick={() => input.current?.click()} disabled={progress !== null}>
        <Icon name="upload" />{t('files.upload')}
      </button>
    </div>
  );
}
