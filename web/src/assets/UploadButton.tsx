import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { upload } from './fileApi';

export function UploadButton({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState(false);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(false);
    try {
      for (const [i, f] of [...list].entries()) {
        await upload(brandId, f, (p) => setProgress((i + p) / list.length));
      }
    } catch {
      setError(true);
    } finally {
      setProgress(null);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      {error && <span role="alert" className="text-red-600">{t('files.uploadError')}</span>}
      {progress !== null && (
        <span className="flex items-center gap-2 text-black/55" aria-live="polite">
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-black/10">
            <span className="block h-full bg-ink" style={{ width: `${Math.round(progress * 100)}%` }} />
          </span>
          {Math.round(progress * 100)}%
        </span>
      )}
      <input ref={input} type="file" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} aria-label={t('files.upload')} />
      <button onClick={() => input.current?.click()} disabled={progress !== null}
        className="rounded-full bg-ink px-3 py-1.5 text-white disabled:opacity-50">
        {t('files.upload')}
      </button>
    </div>
  );
}
