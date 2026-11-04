import { useEffect, useRef, type ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';

export interface Work { id: string; title: string; category: string | null; kind: 'image' | 'video'; at: number | null; url: string }

/** One launch, big: the piece (video plays with sound controls), its title, brand and date, and whatever goes below (reactions). */
export function LaunchModal({ w, sub, onClose, children }: { w: Work; sub: string; onClose: () => void; children?: ReactNode }) {
  const { t } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>('button')?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('keydown', esc); prev?.focus(); };
  }, [onClose]);
  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} className="modal col g12 w-full max-w-[880px]" role="dialog" aria-modal="true" aria-labelledby="launch-title">
        <div className="row between g8">
          <div className="col min-w-0">
            <h2 className="h3 truncate" id="launch-title">{w.title}</h2>
            <span className="t-sm t-mute">{sub}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label={t('st.close')}>✕</button>
        </div>
        {w.kind === 'video'
          ? <video src={w.url} controls autoPlay playsInline className="sd-launch-media" aria-label={w.title} />
          : <img src={w.url} alt={w.title} className="sd-launch-media" />}
        {children}
      </div>
    </div>
  );
}
