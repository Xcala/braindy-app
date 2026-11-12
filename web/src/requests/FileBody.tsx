import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { versionFileText } from './api';
import type { ViewKind } from './useFileUrl';
import type { VersionFile } from './types';

/** A file of a version that is not an image or a video: the PDF in a frame, text to read and copy, or a download card. */
export function FileBody({ brandId, requestId, versionId, index, file, kind, url, onDownload }: {
  brandId: string; requestId: string; versionId: string; index: number; file: VersionFile; kind: ViewKind; url: string; onDownload: () => void;
}) {
  const { t } = useI18n();
  if (kind === 'pdf') return <iframe className="vw-pdf" src={url} title={file.name} />;
  if (kind === 'text' && !file.url) return <TextCard brandId={brandId} requestId={requestId} versionId={versionId} index={index} />;
  return (
    <div className="vw-other">
      <Icon name="file" size={36} />
      <span className="w7" style={{ overflowWrap: 'anywhere' }}>{file.name}</span>
      <p className="t-sm t-mute" style={{ margin: 0 }}>{t('vw.noPreview')}</p>
      <button className="btn btn-primary btn-sm" onClick={onDownload}><Icon name="download" />{t('common.download')}</button>
    </div>
  );
}

function TextCard({ brandId, requestId, versionId, index }: { brandId: string; requestId: string; versionId: string; index: number }) {
  const { t } = useI18n();
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let alive = true;
    setText(null); setError(false);
    versionFileText(brandId, requestId, versionId, index).then((x) => alive && setText(x)).catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [brandId, requestId, versionId, index]);
  const copy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="vw-text">
      {error ? <p className="t-sm t-mute" style={{ margin: 0 }}>{t('vw.textError')}</p>
        : text === null ? <div className="skel" style={{ height: '10rem' }} /> : <pre>{text}</pre>}
      {text && <button className="btn btn-secondary btn-sm self-start" onClick={copy}><Icon name={copied ? 'check' : 'copy'} />{t(copied ? 'vw.copied' : 'vw.copy')}</button>}
    </div>
  );
}
