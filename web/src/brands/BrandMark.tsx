import type { Brand } from './BrandProvider';

const initials = (name: string) =>
  name.replace(/^grupo\s+/i, 'G ').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');

/** Round brand mark: the brand's logo when there is one, otherwise its initials. */
export function BrandMark({ brand }: { brand: Pick<Brand, 'name' | 'logoUrl'> }) {
  if (brand.logoUrl) {
    return <span className="mark mark-img"><img src={brand.logoUrl} alt="" /></span>;
  }
  return <span className="mark" style={{ background: 'var(--azul-press)' }}>{initials(brand.name)}</span>;
}
