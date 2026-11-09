import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { useBrands, type Brand } from '../../brands/BrandProvider';
import { BrandMark } from '../../brands/BrandMark';
import { useI18n } from '../../i18n/I18nProvider';
import { MembersCard } from '../../team/MembersCard';

type Health = { open: number; late: number; last: number };

/** Admin · Brands on a phone: one card per brand (the table is for desktop), each with Open and Manage. */
export function BrandCards({ rows, health, onToggle }: { rows: Array<{ brand: Brand; depth: number }>; health: Map<string, Health>; onToggle: (b: Brand) => void }) {
  const { t } = useI18n();
  const { select } = useBrands();
  const navigate = useNavigate();
  const [managing, setManaging] = useState<string | null>(null);
  const open = (b: Brand) => { select(b.id); navigate('/home'); };
  const current = rows.find((r) => r.brand.id === managing)?.brand;
  return (
    <div className="md:hidden"><div className="col g12">
      {rows.map(({ brand, depth }) => {
        const h = health.get(brand.id);
        const on = brand.status === 'active';
        return (
          <div key={brand.id} className="card col g12" style={{ padding: 16, marginLeft: Math.min(depth, 2) * 16, opacity: on ? 1 : 0.7 }}>
            <button type="button" onClick={() => open(brand)} className="row g12" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', color: 'inherit', minWidth: 0 }}>
              <span className="sel" style={{ border: 0, height: 'auto', padding: 0, background: 'none', flex: 'none' }}><BrandMark brand={brand} /></span>
              <span className="col grow" style={{ minWidth: 0 }}>
                <span className="w7 truncate">{brand.name}</span>
                <span className="t-xs t-mute">{brand.kind === 'group' ? t('brand.group') : t(`status.${brand.status}`)}{h?.open ? ` · ${h.open} ${t('brands.open').toLowerCase()}` : ''}</span>
              </span>
              {h?.late && on ? <span className="chip" style={{ background: '#FDECEA', color: '#C0362C' }}>{t('brands.lateN', { n: h.late })}</span> : null}
            </button>
            <div className="row g8">
              <button type="button" className="btn btn-secondary btn-sm grow" onClick={() => open(brand)}>{t('anav.openBrand')}</button>
              <button type="button" className="btn btn-primary btn-sm grow" onClick={() => setManaging(brand.id)}>{t('anav.manage')}</button>
            </div>
          </div>
        );
      })}
      {current && <Manage brand={current} onToggle={() => onToggle(current)} onClose={() => setManaging(null)} />}
    </div></div>
  );
}

/** Everything about one brand in one place: open it, switch it on or off, its sections and its people with their permissions. */
function Manage({ brand, onToggle, onClose }: { brand: Brand; onToggle: () => void; onClose: () => void }) {
  const { t } = useI18n();
  const { select } = useBrands();
  const navigate = useNavigate();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const on = brand.status === 'active';
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', key); };
  }, [onClose]);
  return createPortal(
    <div className="acct-sheet" role="dialog" aria-modal="true" aria-label={t('anav.manageTitle', { name: brand.name })}>
      <div className="acct-sheet-bar">
        <span className="row g12" style={{ minWidth: 0 }}><span className="sel" style={{ border: 0, height: 'auto', padding: 0, background: 'none', flex: 'none' }}><BrandMark brand={brand} /></span><span className="w7 truncate">{brand.name}</span></span>
        <button ref={closeBtn} type="button" className="acct-x" onClick={onClose} aria-label={t('lb.close')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <div className="acct-sheet-body col g16">
        <button type="button" className="btn btn-primary" onClick={() => { select(brand.id); navigate('/home'); }}>{t('anav.openBrand')}</button>
        <div className="card row between" style={{ padding: 16 }}>
          <span className="w7">{t('anav.status')}</span>
          <span className="row g12">
            <span className="t-sm w7" style={{ color: on ? 'var(--success)' : 'var(--graphite)' }}>{t(`status.${brand.status}`)}</span>
            <button className={`switch ${on ? 'is-on' : ''}`} role="switch" aria-checked={on} aria-label={`${brand.name} ${t('status.active')}`} onClick={onToggle} />
          </span>
        </div>
        <p className="label">{t('anav.people')}</p>
        <MembersCard key={brand.id} brandId={brand.id} brandName={brand.name} />
      </div>
    </div>,
    document.body,
  );
}
