import { useState } from 'react';
import type { Brand } from '../../brands/BrandProvider';
import { BrandMark } from '../../brands/BrandMark';
import { cityById } from '../../brands/cities';
import { Icon } from '../../components/Icon';
import { useI18n } from '../../i18n/I18nProvider';
import './brandCards.css';

type Health = { open: number; late: number; last: number };
type Row = { brand: Brand; depth: number };

/**
 * Admin · Brands on a phone (UX #10): one card per brand instead of the 920 px table.
 * Full name, health, open count and city, and the active switch in one view. Tapping a card opens Manage
 * (which has «Open brand»). Groups are a card «Group · N brands ›» that expands to its brands.
 */
export function BrandCards({ rows, health, searching, onManage, onToggle }: {
  rows: Row[]; health: Map<string, Health>; searching: boolean; onManage: (id: string) => void; onToggle: (b: Brand) => void;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const byId = new Map(rows.map((r) => [r.brand.id, r.brand]));
  // A brand shows when every group above it is open (or while searching, when matches show flat).
  const visible = (b: Brand) => {
    if (searching) return true;
    let g = b.groupId ? byId.get(b.groupId) : undefined;
    while (g) { if (!open.has(g.id)) return false; g = g.groupId ? byId.get(g.groupId) : undefined; }
    return true;
  };
  const flip = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const kids = (id: string) => rows.filter((r) => r.brand.groupId === id).length;

  return (
    <div className="md:hidden"><div className="col g8">
      {rows.filter((r) => visible(r.brand)).map(({ brand, depth }) => brand.kind === 'group'
        ? <GroupCard key={brand.id} brand={brand} depth={searching ? 0 : depth} n={kids(brand.id)} open={open.has(brand.id) || searching} onFlip={() => flip(brand.id)} onManage={() => onManage(brand.id)} />
        : <BrandCard key={brand.id} brand={brand} depth={searching ? 0 : depth} h={health.get(brand.id)} onManage={() => onManage(brand.id)} onToggle={() => onToggle(brand)} />)}
    </div></div>
  );
}

function BrandCard({ brand, depth, h, onManage, onToggle }: { brand: Brand; depth: number; h?: Health; onManage: () => void; onToggle: () => void }) {
  const { t, lang } = useI18n();
  const on = brand.status === 'active';
  const city = cityById(brand.city)?.[lang];
  const meta = [h?.open ? `${h.open} ${t('brands.open').toLowerCase()}` : null, city].filter(Boolean).join(' · ');
  return (
    <div className={`bcard ${on ? '' : 'is-off'}`} style={{ marginLeft: Math.min(depth, 2) * 16 }}>
      <button type="button" className="bcard-main" onClick={onManage} aria-label={t('anav.manageTitle', { name: brand.name })}>
        <span className="bcard-mark"><BrandMark brand={brand} /></span>
        <span className="col grow" style={{ minWidth: 0, gap: '0.25rem' }}>
          <span className="bcard-name">{brand.name}</span>
          <span className="row g8 wrap t-xs t-mute">
            {!on ? <span>{t(`status.${brand.status}`)}</span>
              : h?.late ? <span className="chip bcard-late">{t('brands.lateN', { n: h.late })}</span>
              : h?.open ? <span className="chip c-active">{t('brands.ok')}</span>
              : <span className="chip chip-plain">{t('brands.quiet')}</span>}
            {meta ? <span>{meta}</span> : null}
          </span>
        </span>
      </button>
      <button className={`switch ${on ? 'is-on' : ''}`} role="switch" aria-checked={on} aria-label={`${brand.name} ${t('status.active')}`} onClick={onToggle} />
    </div>
  );
}

function GroupCard({ brand, depth, n, open, onFlip, onManage }: { brand: Brand; depth: number; n: number; open: boolean; onFlip: () => void; onManage: () => void }) {
  const { t } = useI18n();
  return (
    <div className={`bcard ${brand.status === 'active' ? '' : 'is-off'}`} style={{ marginLeft: Math.min(depth, 2) * 16 }}>
      <button type="button" className="bcard-main" onClick={onFlip} aria-expanded={open}>
        <span className="bcard-mark"><BrandMark brand={brand} /></span>
        <span className="col grow" style={{ minWidth: 0, gap: '0.25rem' }}>
          <span className="bcard-name">{brand.name}</span>
          <span className="t-xs t-mute">{n === 1 ? t('bcard.groupOne') : t('bcard.groupOf', { n })}</span>
        </span>
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={16} />
      </button>
      <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onManage} aria-label={t('anav.manageTitle', { name: brand.name })}>
        <Icon name="more" size={16} />
      </button>
    </div>
  );
}
