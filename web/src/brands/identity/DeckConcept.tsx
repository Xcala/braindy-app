import { useI18n } from '../../i18n/I18nProvider';
import type { LegacyAsset } from '../../assets/BrandDocs';

type Shot = { url: string; kind: 'hero' | 'design-concept'; caption?: string };

/** The images that only lived in the LogoDeck (brand cover and design concept), without duplicates. */
export function deckShots(assets: LegacyAsset[]): Shot[] {
  const seen = new Set<string>();
  const out: Shot[] = [];
  for (const a of assets.filter((x) => x.type === 'logodeck')) {
    for (const s of a.data?.sections ?? []) {
      if (s.visible === false || !s.imageUrl || seen.has(s.imageUrl)) continue;
      if (s.type !== 'hero' && s.type !== 'design-concept') continue;
      seen.add(s.imageUrl);
      out.push({ url: s.imageUrl, kind: s.type, caption: s.type === 'hero' ? a.data?.heroSubtitle : undefined });
    }
  }
  return out.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'design-concept' ? -1 : 1));
}

/** "Design concept" in My brand: the LogoDeck content that the identity sections did not show yet. */
export function DeckConcept({ shots }: { shots: Shot[] }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {shots.map((s) => (
        <figure key={s.url} className="card col g8" style={{ padding: 0, overflow: 'hidden', margin: 0 }}>
          <img src={s.url} alt={t(s.kind === 'hero' ? 'brand.cover' : 'brand.concept')} loading="lazy" style={{ width: '100%', aspectRatio: '16 / 9', objectFit: s.kind === 'hero' ? 'cover' : 'contain', background: '#fff', display: 'block' }} />
          <figcaption className="col g4" style={{ padding: '10px 16px 14px' }}>
            <span className="label">{t(s.kind === 'hero' ? 'brand.cover' : 'brand.concept')}</span>
            {s.caption && <span className="t-sm t-mute">{s.caption}</span>}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
