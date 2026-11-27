import type { Brand } from '../../brands/BrandProvider';
import { BrandMark } from '../../brands/BrandMark';
import { Icon } from '../../components/Icon';
import { useI18n } from '../../i18n/I18nProvider';
import './brandCards.css';

export type Health = { open: number; late: number; last: number };
/** One row of the list: the brand, its indent (Groups view only) and, when shown flat, the group it belongs to. */
export type Item = { brand: Brand; depth: number; group?: string; kids?: number };

/**
 * Health in a few words (UX MA4 + menores): late → red chip, open work → «On track» chip,
 * nothing open → plain grey text (no chip), archived → grey «Archived» chip, group → «Group · N brands».
 */
export function HealthBits({ item, h }: { item: Item; h?: Health }) {
  const { t } = useI18n();
  const { brand, kids = 0 } = item;
  if (brand.kind === 'group') return <span className="t-sm t-mute">{kids === 1 ? t('bcard.groupOne') : t('bcard.groupOf', { n: kids })}</span>;
  if (brand.status !== 'active') return <span className="chip c-archived">{t('status.archived')}</span>;
  const open = h?.open ? <span className="t-mute">{h.open} {t('brands.open').toLowerCase()}</span> : null;
  if (h?.late) return <span className="row g8 wrap t-sm"><span className="chip bcard-late">{h.late === 1 ? t('brands.lateOne') : t('brands.lateN', { n: h.late })}</span>{open}</span>;
  if (h?.open) return <span className="row g8 wrap t-sm"><span className="chip c-active">{t('brands.ok')}</span>{open}</span>;
  return <span className="t-sm t-mute">{t('brandsA.noOpen')}</span>;
}

/**
 * Admin · Brands on a phone (UX #10, MA2): one card per brand instead of the table. The card only informs and opens:
 * no switch (archiving lives at the end of «Gestionar»); the «›» says a tap opens it. Groups unfold to their brands.
 */
export function BrandCards({ items, health, open, onFlip, onManage }: {
  items: Item[]; health: Map<string, Health>; open: Set<string>; onFlip: (id: string) => void; onManage: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="md:hidden"><div className="col g8">
      {items.map((item) => {
        const { brand, depth, group } = item;
        const isGroup = brand.kind === 'group';
        return (
          <div key={brand.id} className={`bcard ${brand.status === 'active' ? '' : 'is-off'}`} style={{ marginLeft: Math.min(depth, 2) * 16 }}>
            <button type="button" className="bcard-main" onClick={() => (isGroup ? onFlip(brand.id) : onManage(brand.id))}
              aria-expanded={isGroup ? open.has(brand.id) : undefined} aria-label={isGroup ? undefined : t('anav.manageTitle', { name: brand.name })}>
              <span className="bcard-mark"><BrandMark brand={brand} /></span>
              <span className="col grow" style={{ minWidth: 0, gap: '0.25rem' }}>
                <span className="bcard-name">{brand.name}{group ? <span className="bcard-group"> · {t('brandsA.inGroup', { group })}</span> : null}</span>
                <span className="row g8 wrap t-xs"><HealthBits item={item} h={health.get(brand.id)} /></span>
              </span>
              <Icon name={isGroup && open.has(brand.id) ? 'chevronDown' : 'chevronRight'} size={16} />
            </button>
            {isGroup && (
              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => onManage(brand.id)} aria-label={t('anav.manageTitle', { name: brand.name })}>
                <Icon name="more" size={16} />
              </button>
            )}
          </div>
        );
      })}
    </div></div>
  );
}
