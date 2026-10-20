import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { download, previewKind, signedUrl } from './fileApi';

import type { FileItem } from './fileKinds';
export type { FileItem };

export function Preview({ brandId, file, onClose }: { brandId: string; file: FileItem; onClose: () => void }) {
  const { t } = useI18n();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const kind = previewKind(file.contentType);

  useEffect(() => {
    let alive = true;
    signedUrl(brandId, file.id, true).then((u) => alive && setUrl(u)).catch(() => alive && setError(true));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { alive = false; window.removeEventListener('keydown', onKey); };
  }, [brandId, file.id, onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={file.title} className="fixed inset-0 z-50 flex flex-col bg-black/85 p-4" onClick={onClose}>
      <div className="flex items-center justify-between gap-3 pb-3 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="truncate text-sm">{file.title}</span>
        <div className="flex gap-2">
          <button onClick={() => download(brandId, file.id)} className="rounded-full bg-white px-3 py-1 text-sm text-ink">{t('common.download')}</button>
          <button onClick={onClose} aria-label={t('common.cancel')} className="rounded-full border border-white/40 px-3 py-1 text-sm">✕</button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {error && <p className="text-white/70">{t('files.previewError')}</p>}
        {!url && !error && <p className="text-white/70">{t('common.loading')}…</p>}
        {url && kind === 'image' && <img src={url} alt={file.title} className="max-h-full max-w-full object-contain" />}
        {url && kind === 'video' && <video src={url} controls autoPlay className="max-h-full max-w-full" />}
        {url && kind === 'pdf' && <iframe src={url} title={file.title} className="h-full w-full rounded bg-white" />}
      </div>
    </div>
  );
}
