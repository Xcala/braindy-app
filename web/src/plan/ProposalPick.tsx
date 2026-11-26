import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/Toaster';
import { upload } from '../assets/fileApi';
import { useProposals } from '../proposals/useProposals';
import { createSend } from '../proposals/api';
import type { BrandProposal } from './ProposalCard';

type Src = 'app' | 'link' | 'html';

/** Admin only: choose the brand's proposal. One made in the app (a tracked link to its page), a Google Slides or other link,
 *  or an HTML file uploaded to the brand's Files («Propuesta» folder). */
export function ProposalPick({ brandId, onDone, onCancel, bare }: { brandId: string; onDone: () => void; onCancel?: () => void; bare?: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const { list } = useProposals.optional(true);
  const mine = [...list].sort((a, b) => Number(b.convertedBrandId === brandId) - Number(a.convertedBrandId === brandId));
  const [src, setSrc] = useState<Src>(mine.some((p) => p.convertedBrandId === brandId) ? 'app' : 'link');
  const [pid, setPid] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [pct, setPct] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const chosen = pid || mine.find((p) => p.convertedBrandId === brandId)?.id || '';

  async function save(p: BrandProposal) {
    await setDoc(doc(db, 'brands', brandId, 'context', 'proposal'), { ...p, title: p.title || null, at: serverTimestamp() });
    toast({ text: t('pp.saved'), tone: 'ok' });
    onDone();
  }
  async function submit() {
    setBusy(true);
    try {
      if (src === 'app') {
        const prop = mine.find((p) => p.id === chosen);
        if (!prop) return;
        const r = await createSend(prop.id, 'link', 'Braindy · Mi plan', '');
        await save({ kind: 'app', url: r.url, proposalId: prop.id, title: title.trim() || prop.title });
      } else if (src === 'link') {
        const u = url.trim();
        if (!/^https?:\/\//.test(u)) return;
        await save({ kind: /docs\.google\.com\/presentation/.test(u) ? 'slides' : 'link', url: u, title: title.trim() });
      }
    } catch { toast({ text: t('pp.error'), tone: 'bad' }); } finally { setBusy(false); }
  }
  async function onFile(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    try {
      const assetId = await upload(brandId, f, (p) => setPct(Math.round(p * 100)), 'Propuesta');
      await save({ kind: 'html', assetId, title: title.trim() || f.name.replace(/\.html?$/i, '') });
    } catch { toast({ text: t('pp.error'), tone: 'bad' }); } finally { setBusy(false); setPct(null); if (file.current) file.current.value = ''; }
  }

  const ready = src === 'app' ? !!chosen : src === 'link' ? /^https?:\/\/\S+$/.test(url.trim()) : false;
  return (
    <section className={bare ? 'col g16' : 'card col g16'} aria-labelledby="pp-add" style={bare ? undefined : { borderStyle: 'dashed' }}>
      <div className="col g4">
        {!bare && <p className="label">{t('pp.admin')}</p>}
        <h2 id="pp-add" className="h3">{t('pp.addTitle')}</h2>
        <p className="t-sm t-mute" style={{ margin: 0 }}>{t('pp.addHint')}</p>
      </div>
      {/* Stacks on a narrow screen instead of cutting «Google Slides o enlace» off (2026-11-24). */}
      <div className="seg seg-stack" role="radiogroup" aria-label={t('pp.addTitle')}>
        {(['app', 'link', 'html'] as Src[]).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={src === k} className={src === k ? 'is-on' : ''} onClick={() => setSrc(k)}>{t(`pp.src.${k}`)}</button>
        ))}
      </div>
      {src === 'app' && (mine.length ? (
        <select className="input" value={chosen} onChange={(e) => setPid(e.target.value)} aria-label={t('pp.pick')}>
          <option value="" disabled>{t('pp.pick')}</option>
          {mine.map((p) => <option key={p.id} value={p.id}>{p.title || p.prospect?.company || p.id}{p.prospect?.company && p.title ? ` · ${p.prospect.company}` : ''}</option>)}
        </select>
      ) : <p className="t-sm t-mute" style={{ margin: 0 }}>{t('pp.noneApp')} <Link to="/admin/proposals">{t('pp.newInApp')} →</Link></p>)}
      {src === 'link' && <input className="input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.google.com/presentation/d/…" aria-label={t('pp.url')} />}
      <input className="input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder={t('pp.title')} aria-label={t('pp.title')} />
      <div className="row g8 wrap">
        {src === 'html' ? <>
          <input ref={file} type="file" accept=".html,.htm,text/html" className="sr" onChange={(e) => onFile(e.target.files?.[0])} aria-label={t('pp.file')} />
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => file.current?.click()}>{pct !== null ? t('pp.uploading', { n: pct }) : t('pp.file')}</button>
        </> : <button type="button" className="btn btn-primary" disabled={busy || !ready} onClick={submit}>{t('pp.save')}</button>}
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>{t('pp.cancel')}</button>}
      </div>
    </section>
  );
}
