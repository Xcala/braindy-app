import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { formatBytes, signedUrl } from '../assets/fileApi';
import type { AttachedFile } from './types';

/** Files the client attached to a request (previous deck, photos, PDFs…). Each opens through a short-lived link. */
export function AttachedFiles({ brandId, files }: { brandId: string; files?: AttachedFile[] }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState<string | null>(null);
  if (!files?.length) return null;
  const open = async (f: AttachedFile) => {
    setFailed(null);
    try { window.open(await signedUrl(brandId, f.assetId, true), '_blank', 'noopener,noreferrer'); } catch { setFailed(f.assetId); }
  };
  return (
    <div className="col g4">
      <span className="label">{t('req.attached', { n: files.length })}</span>
      {files.map((f) => (
        <button key={f.assetId} type="button" className="row g8 t-sm text-left" onClick={() => open(f)}
          style={{ background: 'none', border: 0, padding: '4px 0', cursor: 'pointer', color: 'var(--azul)' }}>
          <Icon name="file" size={16} />
          <span className="grow truncate">{f.name}</span>
          <span className="t-xs t-mute">{failed === f.assetId ? t('files.uploadError') : formatBytes(f.size)}</span>
        </button>
      ))}
    </div>
  );
}
