import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { signedUrl } from '../assets/fileApi';

export type BrandProposal = { kind: 'app' | 'slides' | 'html' | 'link'; title?: string; url?: string; assetId?: string; proposalId?: string };

/** Google Slides links become their embed view; anything else is not embedded. */
export const slidesEmbed = (url: string) => {
  const m = url.match(/docs\.google\.com\/presentation\/d\/([\w-]+)/);
  return m ? `https://docs.google.com/presentation/d/${m[1]}/embed?start=false&loop=false` : null;
};

/** A title a person wrote, never a pasted link or a file path (a Storage URL once showed as the heading, 2026-11-24). */
export const proposalTitle = (p: BrandProposal, fallback: string) => {
  const x = (p.title ?? '').trim();
  return !x || /^https?:\/\/|^\S*[/\\]\S*$|\.(html?|pdf)$/i.test(x) ? fallback : x;
};

/**
 * «Your proposal» (2026-11-17), at the top of My plan's summary: the proposal Nick made for the brand, whether it was made in
 * the app (its public page), a Google Slides deck (shown inline) or an HTML file. The client and Nick see the same card;
 * Nick picks, changes or removes it in «Edit plan» (PlanEditor), not here.
 */
export function ProposalCard({ brandId, brandName }: { brandId: string; brandName: string }) {
  const { t } = useI18n();
  const { data, loading } = useBrandDoc(brandId, 'context/proposal');
  const p = data as BrandProposal | null;
  if (loading || !p) return null;
  const title = proposalTitle(p, t('pp.for', { brand: brandName }));
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
          <h2 id="plan-proposal" className="h2" style={{ overflowWrap: 'anywhere' }}>{title}</h2>
        </div>
        <button type="button" className="btn btn-primary" onClick={open}>{t('pp.open')} ↗</button>
      </div>
      {embed && (
        <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: '1rem', overflow: 'hidden', background: 'var(--line)' }}>
          <iframe src={embed} title={title} allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
        </div>
      )}
    </section>
  );
}
