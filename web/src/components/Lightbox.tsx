import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nProvider';

export type LightboxItem = { url: string; name?: string };

/** Full-screen viewer that walks through a set of images: arrows, keyboard, swipe, counter and download. */
export function Lightbox({ items, index, onIndex, onClose }: { items: LightboxItem[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const n = items.length;
  const go = (d: number) => onIndex((index + d + n) % n);
  const item = items[index];

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; prev?.focus?.(); };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });
  // Preload the neighbours so moving between images feels instant.
  useEffect(() => { if (n > 1) [items[(index + 1) % n], items[(index - 1 + n) % n]].forEach((i) => { new Image().src = i.url; }); }, [index, items, n]);

  if (!item) return null;
  const nav = 'absolute top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full text-2xl text-white';
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={item.name ?? t('lb.image')} className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'rgba(6,9,18,.94)' }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { const x = touchX.current; touchX.current = null; if (x === null) return; const dx = e.changedTouches[0].clientX - x; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <span className="t-sm" aria-live="polite" style={{ fontVariantNumeric: 'tabular-nums', opacity: .8 }}>{index + 1} / {n}</span>
        <div className="flex items-center gap-2">
          <a href={item.url} target="_blank" rel="noreferrer" download className="btn btn-sm" style={{ color: '#fff', border: '1px solid #ffffff40', textDecoration: 'none' }}>↓ {t('lb.download')}</a>
          <button ref={closeRef} type="button" onClick={onClose} className="btn btn-sm" style={{ color: '#fff', border: '1px solid #ffffff40' }} aria-label={t('lb.close')}>✕</button>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-20" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <img key={item.url} src={item.url} alt={item.name ?? ''} className="max-h-full max-w-full rounded-[0.75rem] object-contain" style={{ boxShadow: '0 20px 60px #0008' }} />
        {n > 1 && <>
          <button type="button" className={`${nav} left-2 sm:left-5`} style={{ background: '#ffffff1f' }} onClick={() => go(-1)} aria-label={t('lb.prev')}>‹</button>
          <button type="button" className={`${nav} right-2 sm:right-5`} style={{ background: '#ffffff1f' }} onClick={() => go(1)} aria-label={t('lb.next')}>›</button>
        </>}
      </div>
      {item.name && <p className="t-sm px-4 pb-4 text-center text-white" style={{ opacity: .85 }}>{item.name}</p>}
    </div>,
    document.body,
  );
}
