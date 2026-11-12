import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { deleteResource, KINDS, saveResource, sizeLabel, uploadResourceFile, type Kind, type Resource, type ResourceFile } from './useResources';

const EMPTY = { es: '', en: '' };

/** NickMark only: add or edit a resource (bilingual title and text, a file, a link and/or a text to copy). */
export function ResourceEditor({ r, nextOrder, onClose }: { r: Resource | null; nextOrder: number; onClose: () => void }) {
  const { t } = useI18n();
  const [title, setTitle] = useState(r?.title ?? EMPTY);
  const [summary, setSummary] = useState(r?.summary ?? EMPTY);
  const [howTo, setHowTo] = useState(r?.howTo ?? EMPTY);
  const [kind, setKind] = useState<Kind>(r?.kind ?? 'skill');
  const [tags, setTags] = useState((r?.tags ?? []).join(', '));
  const [url, setUrl] = useState(r?.url ?? '');
  const [body, setBody] = useState(r?.body ?? '');
  const [file, setFile] = useState<ResourceFile | null>(r?.file ?? null);
  const [published, setPublished] = useState(r ? r.status === 'published' : true);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);

  async function pick(f: File | undefined) {
    if (!f) return;
    setError(''); setProgress(0);
    try { setFile(await uploadResourceFile(f, setProgress)); } catch { setError(t('res.f.error')); } finally { setProgress(null); }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!(title.es.trim() || title.en.trim()) || !(file || url.trim() || body.trim())) { setError(t('res.f.need')); return; }
    setBusy(true); setError('');
    try {
      await saveResource(r?.id ?? null, {
        status: published ? 'published' : 'draft', kind, order: r?.order ?? nextOrder,
        title: { es: title.es.trim() || title.en.trim(), en: title.en.trim() || title.es.trim() },
        summary: { es: summary.es.trim() || summary.en.trim(), en: summary.en.trim() || summary.es.trim() },
        howTo: { es: howTo.es.trim(), en: howTo.en.trim() },
        tags: tags.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 12),
        url: url.trim(), body, file,
      });
      onClose();
    } catch { setError(t('res.f.error')); } finally { setBusy(false); }
  }
  const pair = (label: [string, string], v: typeof EMPTY, set: (x: typeof EMPTY) => void, rows = 0) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {(['es', 'en'] as const).map((l, i) => (
        <label key={l} className="col g6"><span className="label">{label[i]}</span>
          {rows ? <textarea className="input" rows={rows} value={v[l]} onChange={(e) => set({ ...v, [l]: e.target.value })} />
            : <input className="input" value={v[l]} onChange={(e) => set({ ...v, [l]: e.target.value })} />}
        </label>
      ))}
    </div>
  );

  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal w-full max-w-[720px] res-editor" role="dialog" aria-modal="true" aria-labelledby="res-e-title" onSubmit={save}>
        <h2 className="h2" id="res-e-title">{r ? t('res.edit') : t('res.new')}</h2>
        <label className="col g6"><span className="label">{t('res.f.kind')}</span>
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>{KINDS.map((k) => <option key={k} value={k}>{t(`res.kind.${k}`)}</option>)}</select>
        </label>
        {pair([t('res.f.titleEs'), t('res.f.titleEn')], title, setTitle)}
        {pair([t('res.f.sumEs'), t('res.f.sumEn')], summary, setSummary, 3)}
        {pair([t('res.f.howEs'), t('res.f.howEn')], howTo, setHowTo, 3)}
        <label className="col g6"><span className="label">{t('res.f.body')}</span><textarea className="input res-mono" rows={5} value={body} onChange={(e) => setBody(e.target.value)} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="col g6"><span className="label">{t('res.f.url')}</span><input className="input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></label>
          <label className="col g6"><span className="label">{t('res.f.tags')}</span><input className="input" value={tags} onChange={(e) => setTags(e.target.value)} /></label>
        </div>
        <div className="col g6"><span className="label">{t('res.f.file')}</span>
          {file ? <span className="row g8 wrap"><span className="t-sm w7">{file.name}</span><span className="t-xs t-mute">{sizeLabel(file.size)}</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => setFile(null)}>{t('res.f.remove')}</button></span>
            : progress !== null ? <span className="t-sm t-mute">{t('res.f.uploading', { p: Math.round(progress * 100) })}</span>
            : <label className="btn btn-secondary btn-sm self-start" style={{ cursor: 'pointer' }}>{t('res.f.pick')}<input type="file" hidden onChange={(e) => pick(e.target.files?.[0])} /></label>}
        </div>
        <label className="row g8 t-sm"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />{t('res.f.published')}</label>
        {error && <p className="t-sm" role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
        <div className="row between g8 wrap">
          {r ? <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setAsking(true)}>{t('res.f.delete')}</button> : <span />}
          <span className="row g8"><button type="button" className="btn btn-secondary" onClick={onClose}>{t('res.close')}</button>
            <button type="submit" className="btn btn-primary" disabled={busy || progress !== null}>{t('res.f.save')}</button></span>
        </div>
      </form>
      {asking && r && <ConfirmDialog title={t('res.f.deleteQ')} confirmLabel={t('res.f.delete')} danger onCancel={() => setAsking(false)} onConfirm={() => { void deleteResource(r.id).then(onClose); }} />}
    </div>
  );
}
