import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/Icon';
import type { BrandRequest } from '../types';
import { AskStart, type Seed } from './AskStart';
import { AskCompose } from './AskCompose';
import './ask.css';

/**
 * "New request" as a side panel (full screen on phones): first what you want to achieve, then the details.
 * Escape or the scrim closes it; focus goes into the panel and comes back to the button that opened it.
 */
export function AskPanel({ brandId, list, onClose }: { brandId: string; list: BrandRequest[]; onClose: () => void }) {
  const { t } = useI18n();
  const [seed, setSeed] = useState<Seed | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close.current(); };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = overflow; back?.focus?.(); };
  }, []);
  useEffect(() => { panel.current?.scrollTo({ top: 0 }); }, [seed]);

  return (
    <div className="ask-layer">
      <div className="ask-scrim" onClick={onClose} aria-hidden />
      <div ref={panel} className="ask-panel" role="dialog" aria-modal="true" aria-labelledby="h-ask" tabIndex={-1}>
        <div className="row between g12">
          <div className="row g12">
            <img src="/brand/proposal/nicolas-face.jpg" alt="" className="h-11 w-11 flex-none rounded-full object-cover" />
            <span className="col"><h2 className="h3" id="h-ask" style={{ margin: 0 }}>{t('ask.simpleTitle')}</h2><span className="t-xs t-mute">{t('as.sub')}</span></span>
          </div>
          <button type="button" className="fx-ibtn" onClick={onClose} aria-label={t('be.close')}><Icon name="x" size={16} /></button>
        </div>
        {seed ? <AskCompose key={JSON.stringify(seed)} brandId={brandId} seed={seed} onBack={() => setSeed(null)} />
          : <AskStart brandId={brandId} list={list} onPick={setSeed} />}
      </div>
    </div>
  );
}
