import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Lightbox } from '../../components/Lightbox';
import type { LegacyAsset } from '../../assets/BrandDocs';

type Shot = { url: string; kind: 'hero' | 'design-concept'; caption?: string };

const PLACEHOLDER = /^https?:\/\/(picsum\.photos|placehold|via\.placeholder)/i;

/** The images that only lived in the LogoDeck (brand cover and design concept), without duplicates. */
export function deckShots(assets: LegacyAsset[]): Shot[] {
  const seen = new Set<string>();
  const out: Shot[] = [];
  for (const a of assets.filter((x) => x.type === 'logodeck')) {
    for (const s of a.data?.sections ?? []) {
      // The old Brands app filled an empty concept with a stock photo (picsum): that is no concept, so the section stays hidden.
      if (s.visible === false || !s.imageUrl || PLACEHOLDER.test(s.imageUrl) || seen.has(s.imageUrl)) continue;
      if (s.type !== 'hero' && s.type !== 'design-concept') continue;
      seen.add(s.imageUrl);
      out.push({ url: s.imageUrl, kind: s.type, caption: s.type === 'hero' ? a.data?.heroSubtitle : undefined });
    }
  }
  return out.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'design-concept' ? -1 : 1));
}

/** "Design concept" in My brand: the LogoDeck content that the identity sections did not show yet.
 *  On phones each slide is shown tall enough to read and swipes sideways; a tap opens it full screen. */
export function DeckConcept({ shots }: { shots: Shot[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(null);
  const name = (s: Shot) => t(s.kind === 'hero' ? 'brand.cover' : 'brand.concept');
  return (
    <>
      <div className="dc-grid grid gap-5 md:grid-cols-2">
        {shots.map((s, i) => (
          <figure key={s.url} className="card col" style={{ padding: 0, overflow: 'hidden', margin: 0 }}>
            <div className="dc-pan">
              <button type="button" className="dc-shot" onClick={() => setOpen(i)} aria-label={`${name(s)} · ${t('brand.tapToZoom')}`}>
                <img src={s.url} alt={name(s)} loading="lazy" className={s.kind === 'hero' ? 'dc-img dc-cover' : 'dc-img'} />
              </button>
            </div>
            <figcaption className="dc-cap row between g8" style={{ padding: '10px 16px 14px' }}>
              <span className="col g4" style={{ minWidth: 0 }}>
                <span className="label">{name(s)}</span>
                {s.caption && <span className="t-sm t-mute">{s.caption}</span>}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(i)}>⤢ {t('brand.tapToZoom')}</button>
            </figcaption>
          </figure>
        ))}
      </div>
      {open !== null && <Lightbox items={shots.map((s) => ({ url: s.url, name: name(s) }))} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}
