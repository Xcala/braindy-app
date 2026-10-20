import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { formatBytes } from '../assets/fileApi';
import { proposalFileUrl, uploadProposalFile } from './api';
import { useProposalFiles } from './useProposals';

export function ProposalFiles({ id }: { id: string }) {
  const { t } = useI18n();
  const files = useProposalFiles(id).filter((f) => f.status === 'ready');
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState(false);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(false);
    try {
      for (const [i, f] of [...list].entries()) await uploadProposalFile(id, f, (p) => setProgress((i + p) / list.length));
    } catch { setError(true); } finally { setProgress(null); if (input.current) input.current.value = ''; }
  }

  return (
    <section className="card col g16" aria-labelledby="pfiles">
      <div className="row between">
        <h2 className="h3" id="pfiles">{t('proposals.files')}</h2>
        <div className="row g8">
          {progress !== null && <span className="t-sm t-mute">{Math.round(progress * 100)}%</span>}
          {error && <span className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{t('files.uploadError')}</span>}
          <input ref={input} type="file" multiple className="sr" onChange={(e) => onFiles(e.target.files)} aria-label={t('proposals.addFile')} />
          <button className="btn btn-ghost btn-sm" onClick={() => input.current?.click()} disabled={progress !== null}><Icon name="upload" />{t('proposals.addFile')}</button>
        </div>
      </div>
      {files.length === 0 ? <p className="t-sm t-mute">{t('proposals.noFiles')}</p> : (
        <div className="list" style={{ borderRadius: 16 }}>
          {files.map((f) => (
            <div key={f.id} className="lrow" style={{ gridTemplateColumns: 'minmax(0,1fr) 100px 96px' }}>
              <span className="row g12 min-w-0"><span className="ficon th-pdf"><Icon name="file" /></span><span className="w7 truncate">{f.title}</span></span>
              <span className="t-sm t-mute">{formatBytes(f.size)}</span>
              <button className="btn btn-ghost btn-sm" onClick={async () => window.open(await proposalFileUrl(id, f.id), '_blank', 'noopener')}>{t('common.open')}</button>
            </div>
          ))}
        </div>
      )}
      <p className="t-xs t-mute">{t('proposals.filesHint')}</p>
    </section>
  );
}
