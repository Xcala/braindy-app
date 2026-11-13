import { useNavigate } from 'react-router';
import { useBrands, type Brand } from '../../brands/BrandProvider';
import { BrandMark } from '../../brands/BrandMark';
import { useI18n } from '../../i18n/I18nProvider';

type Health = { open: number; late: number; last: number };

/** Admin · Brands on a phone: one card per brand (the table is for desktop), each with Open and Manage. */
export function BrandCards({ rows, health, onManage }: { rows: Array<{ brand: Brand; depth: number }>; health: Map<string, Health>; onManage: (id: string) => void }) {
  const { t } = useI18n();
  const { select } = useBrands();
  const navigate = useNavigate();
  const open = (b: Brand) => { select(b.id); navigate('/home'); };
  return (
    <div className="md:hidden"><div className="col g12">
      {rows.map(({ brand, depth }) => {
        const h = health.get(brand.id);
        const on = brand.status === 'active';
        return (
          <div key={brand.id} className="card col g12" style={{ padding: '1rem', marginLeft: Math.min(depth, 2) * 16, opacity: on ? 1 : 0.7 }}>
            <button type="button" onClick={() => open(brand)} className="row g12" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', color: 'inherit', minWidth: 0 }}>
              <span className="sel" style={{ border: 0, height: 'auto', padding: 0, background: 'none', flex: 'none' }}><BrandMark brand={brand} /></span>
              <span className="col grow" style={{ minWidth: 0 }}>
                <span className="w7 truncate">{brand.name}</span>
                <span className="t-xs t-mute">{brand.kind === 'group' ? t('brand.group') : t(`status.${brand.status}`)}{h?.open ? ` · ${h.open} ${t('brands.open').toLowerCase()}` : ''}</span>
              </span>
              {h?.late && on ? <span className="chip" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>{t('brands.lateN', { n: h.late })}</span> : null}
            </button>
            <div className="row g8">
              <button type="button" className="btn btn-secondary btn-sm grow" onClick={() => open(brand)}>{t('anav.openBrand')}</button>
              <button type="button" className="btn btn-primary btn-sm grow" onClick={() => onManage(brand.id)}>{t('anav.manage')}</button>
            </div>
          </div>
        );
      })}
    </div></div>
  );
}
