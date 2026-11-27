import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { useBrands, type Brand } from '../../brands/BrandProvider';
import { BrandMark } from '../../brands/BrandMark';
import { useI18n } from '../../i18n/I18nProvider';
import { MembersCard } from '../../team/MembersCard';
import { BrandIdentityEdit } from './BrandIdentityEdit';
import { BrandManageMore } from './BrandManageMore';

/** Everything about one brand in one place: open it, its identity, its people, its details and, at the end (UX MA2), archive. Admin's only per-brand page. */
export function BrandManage({ brand, onToggle, onClose }: { brand: Brand; onToggle: () => void; onClose: () => void }) {
  const { t } = useI18n();
  const { select } = useBrands();
  const navigate = useNavigate();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const on = brand.status === 'active';
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.scrim')) onClose(); };
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', key); };
  }, [onClose]);
  return createPortal(
    <div className="acct-sheet" role="dialog" aria-modal="true" aria-label={t('anav.manageTitle', { name: brand.name })}>
      <div className="acct-sheet-bar">
        <span className="row g8" style={{ minWidth: 0 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label={t('anav.allBrands')} style={{ paddingLeft: '0.5rem' }}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg><span className="hidden sm:inline">{t('anav.allBrands')}</span></button>
          <span className="row g12" style={{ minWidth: 0 }}><span className="sel" style={{ border: 0, height: 'auto', padding: 0, background: 'none', flex: 'none' }}><BrandMark brand={brand} /></span><span className="w7 truncate">{brand.name}</span></span>
        </span>
        <button ref={closeBtn} type="button" className="acct-x" onClick={onClose} aria-label={t('lb.close')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <div className="acct-sheet-body col g16">
        <button type="button" className="btn btn-primary" onClick={() => { select(brand.id); navigate('/home'); }}>{t('anav.openBrand')}</button>
        {!on && <span className="chip c-archived" style={{ alignSelf: 'flex-start' }}>{t('status.archived')}</span>}
        <BrandIdentityEdit key={brand.id} brand={brand} />
        <p className="label">{t('anav.people')}</p>
        <MembersCard key={brand.id} brandId={brand.id} brandName={brand.name} />
        <p className="t-xs t-mute">{t('team.membersHint')}</p>
        <BrandManageMore key={`more-${brand.id}`} brand={brand} onToggle={onToggle} />
      </div>
    </div>,
    document.body,
  );
}
