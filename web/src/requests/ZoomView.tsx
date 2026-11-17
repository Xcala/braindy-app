import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';

/**
 * Full-screen look at one image. It opens fitted to the screen width, so a long piece (a page, a table) scrolls
 * up and down; a click (or the + button) zooms to double size on the spot you clicked, and scrolls both ways.
 */
export function ZoomView({ url, name, onClose }: { url: string; name?: string; onClose: () => void }) {
  const { t } = useI18n();
  const pane = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [zoom, setZoom] = useState(false);
  const aim = useRef<{ fx: number; fy: number; cx: number; cy: number } | null>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => { window.removeEventListener('keydown', onKey, true); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [onClose]);

  // After zooming in, keep the clicked spot under the pointer.
  useLayoutEffect(() => {
    const p = pane.current, a = aim.current;
    if (!p || !a) return;
    const img = p.querySelector('img')!;
    p.scrollLeft = img.offsetLeft + a.fx * img.offsetWidth - a.cx;
    p.scrollTop = img.offsetTop + a.fy * img.offsetHeight - a.cy;
    aim.current = null;
  }, [zoom]);

  const toggle = (e?: MouseEvent<HTMLImageElement>) => {
    const p = pane.current;
    if (e && p && !zoom) {
      const r = e.currentTarget.getBoundingClientRect(), pr = p.getBoundingClientRect();
      aim.current = { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height, cx: e.clientX - pr.left, cy: e.clientY - pr.top };
    }
    setZoom((z) => !z);
  };

  const bar = 'btn btn-sm';
  const barStyle = { color: '#fff', border: '1px solid #ffffff40' };
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={name ?? t('vw.image')} className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'rgba(6,9,18,.94)' }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <span className="t-sm truncate" style={{ opacity: .85 }}>{name}</span>
        <div className="flex flex-none items-center gap-2">
          <button type="button" className={bar} style={barStyle} onClick={() => toggle()} aria-pressed={zoom}>{zoom ? '−' : '+'} {t(zoom ? 'vw.zoomOut' : 'vw.zoomIn')}</button>
          <button ref={closeRef} type="button" className={bar} style={barStyle} onClick={onClose} aria-label={t('vw.zoomClose')}><Icon name="x" size={16} /></button>
        </div>
      </div>
      <div ref={pane} className="min-h-0 flex-1 overflow-auto px-4 pb-6" style={{ overscrollBehavior: 'contain' }}
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <img src={url} alt={name ?? ''} draggable={false} onClick={toggle}
          className="mx-auto block select-none rounded-lg"
          style={zoom
            ? { width: 'min(200%, 400rem)', maxWidth: 'none', cursor: 'zoom-out' }
            : { width: 'auto', maxWidth: '100%', cursor: 'zoom-in' }} />
      </div>
    </div>,
    document.body,
  );
}
