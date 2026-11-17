import { useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { signedUrl } from '../assets/fileApi';
import { ProposalPick } from './ProposalPick';

export type BrandProposal = { kind: 'app' | 'slides' | 'html' | 'link'; title?: string; url?: string; assetId?: string; proposalId?: string };

/** Google Slides links become their embed view; anything else is not embedded. */
export const slidesEmbed = (url: string) => {
  const m = url.match(/docs\.google\.com\/presentation\/d\/([\w-]+)/);
  return m ? `https://docs.google.com/presentation/d/${m[1]}/embed?start=false&loop=false` : null;
};

/**
 * «Your proposal» (2026-11-17), at the top of My plan's summary: the proposal Nick made for the brand, whether it was made in
 * the app (its public page), a Google Slides deck (shown inline) or an HTML file. Nick picks or changes it; the client sees it.
 */
export function ProposalCard({ brandId, admin }: { brandId: string; admin: boolean }) {
  const { t } = useI18n();
  const { data, loading } = useBrandDoc(brandId, 'context/proposal');
  const p = data as BrandProposal | null;
  const [editing, setEditing] = useState(false);
  if (loading) return null;
  if (!p || editing) {
    if (!admin) return null;
    return <ProposalPick brandId={brandId} onDone={() => setEditing(false)} onCancel={p ? () => setEditing(false) : undefined} />;
  }
  const embed = p.kind === 'slides' && p.url ? slidesEmbed(p.url) : null;
  const open = async () => {
    const w = window.open('', '_blank');
    const url = p.kind === 'html' && p.assetId ? await signedUrl(brandId, p.assetId, true) : p.url;
    if (w && url) { w.opener = null; w.location.href = url; } else w?.close();
  };
  return (
    <section className="card col g16" aria-labelledby="plan-proposal">
      <div className="row between g12 wrap" style={{ alignItems: 'flex-end' }}>
        <div className="col g4" style={{ minWidth: 0 }}>
          <p className="label">{t('pp.label')} · {t(`pp.kind.${p.kind}`)}</p>
          <h2 id="plan-proposal" className="h2">{p.title || t('pp.label')}</h2>
        </div>
        <div className="row g8 wrap">
          {admin && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>{t('pp.change')}</button>}
          {admin && <button type="button" className="btn btn-ghost btn-sm" onClick={() => deleteDoc(doc(db, 'brands', brandId, 'context', 'proposal'))}>{t('pp.remove')}</button>}
          <button type="button" className="btn btn-primary" onClick={open}>{t('pp.open')} ↗</button>
        </div>
      </div>
      {embed && (
        <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: '1rem', overflow: 'hidden', background: 'var(--line)' }}>
          <iframe src={embed} title={p.title || t('pp.label')} allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
        </div>
      )}
    </section>
  );
}
