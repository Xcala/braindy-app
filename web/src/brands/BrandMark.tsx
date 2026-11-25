import { useState } from 'react';
import type { Brand } from './BrandProvider';

const initials = (name: string) =>
  name.replace(/^grupo\s+/i, 'G ').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');

/** Round brand mark: the brand's logo when there is one and it loads, otherwise its initials (never an empty circle). */
export function BrandMark({ brand }: { brand: Pick<Brand, 'name' | 'logoUrl'> }) {
  const [broken, setBroken] = useState<string | null>(null);
  if (brand.logoUrl && broken !== brand.logoUrl) {
    return <span className="mark mark-img"><img src={brand.logoUrl} alt="" onError={() => setBroken(brand.logoUrl ?? null)} /></span>;
  }
  return <span className="mark" style={{ background: 'var(--azul-press)' }}>{initials(brand.name) || brand.name.trim().charAt(0).toUpperCase() || 'B'}</span>;
}
