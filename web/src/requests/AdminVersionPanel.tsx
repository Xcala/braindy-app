import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { brainName } from '../components/BrainStack';
import { markPublished, uploadVersion } from './api';
import type { BrainId } from './taxonomy';
import type { BrandRequest } from './types';

/** Nicolas's delivery panel: upload a new version (files + reason), publish to the client, mark live. */
export function AdminVersionPanel({ brandId, r }: { brandId: string; r: BrandRequest }) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [brain, setBrain] = useState<BrainId>(r.leadBrain);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState(false);

  async function deliver() {
    setError(false);
    try {
      await uploadVersion(brandId, r.id, files, { notes, reason, brain }, setProgress);
      setFiles([]); setNotes(''); setReason('');
    } catch { setError(true); } finally { setProgress(null); }
  }

  return (
    <section className="card col g16" style={{ borderStyle: 'dashed' }} aria-labelledby="deliver">
      <div className="row between g8 wrap"><h2 className="h3" id="deliver">{t('req.deliverTitle', { n: (r.versionCount ?? 0) + 1 })}</h2><span className="chip c-group">{t('role.admin')}</span></div>
      <div className="row g12 wrap">
        <input ref={input} type="file" multiple className="sr" onChange={(e) => setFiles([...(e.target.files ?? [])])} aria-label={t('req.pickFiles')} />
        <button className="btn btn-secondary" onClick={() => input.current?.click()}><Icon name="upload" />{t('req.pickFiles')}</button>
        <span className="t-sm t-mute">{files.length ? files.map((f) => f.name).join(', ') : t('req.noFilesPicked')}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="field"><label htmlFor="vb">{t('req.madeByBrain')}</label>
          <select id="vb" className="input" value={brain} onChange={(e) => setBrain(e.target.value as BrainId)}>
            {(['researcher', 'marketer', 'creator', 'builder'] as BrainId[]).map((b) => <option key={b} value={b}>{brainName(b)}</option>)}
          </select></div>
        <div className="field"><label htmlFor="vn">{t('req.versionNotes')}</label><input id="vn" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('req.versionNotesPh')} /></div>
      </div>
      <div className="field"><label htmlFor="vr">{t('req.whyItWorks')}</label><input id="vr" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('req.reasonPh')} /></div>
      {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{t('req.deliverError')}</p>}
      <div className="row g12 wrap">
        <button className="btn btn-primary" disabled={!files.length || progress !== null} onClick={deliver}>
          {progress !== null ? `${Math.round(progress * 100)}%` : t('req.deliver')}
        </button>
        {r.status === 'approved' && <button className="btn btn-secondary" onClick={() => markPublished(brandId, r.id)}>{t('req.markLive')}</button>}
        <span className="t-sm t-mute">{t('req.deliverHint')}</span>
      </div>
    </section>
  );
}
