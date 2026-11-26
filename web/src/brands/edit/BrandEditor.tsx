import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useScrollFade } from '../../components/useScrollFade';
import type { StringKey } from '../../i18n/strings';
import type { VoiceDoc } from '../identity/Voice';
import type { BrainDoc } from '../identity/Strategy';
import { ImagesEdit, LogosEdit, type LogoSet } from './VisualEdit';
import { ColorsEdit, FontsEdit } from './ListEdit';
import { PrimalEdit, StrategyEdit, VoiceEdit } from './WordsEdit';
import type { PrimalDoc } from '../identity/Primal';

export type EditableIdentity = {
  logos?: LogoSet; colors?: Array<{ hex?: string; name?: string; pantone?: string }>; typography?: Array<Record<string, string>>;
  concept?: Array<{ url: string; caption?: string }>; galleryAssets?: Array<{ url?: string; name?: string }>;
};
const TABS = ['logos', 'colors', 'type', 'concept', 'mockups', 'primal', 'voice', 'strategy'] as const;
type Tab = typeof TABS[number];

/** Admin editor of Mi marca: one tab per section, each saved on its own (same logic as the Braindy connector). */
export function BrandEditor({ brandId, identity, voice, brain, primal, onClose }: {
  brandId: string; identity: EditableIdentity; voice: (VoiceDoc & { archetype?: string[] }) | null; brain: BrainDoc | null; primal: PrimalDoc | null; onClose: () => void;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('logos');
  // On a phone the eight tabs scroll: fade the edge with more and keep the open tab in view (audit #38).
  const tabsRef = useRef<HTMLDivElement>(null);
  useScrollFade(tabsRef, tab);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="scrim fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="h-be" className="card col g16 my-6 w-full" style={{ maxWidth: '55rem' }}>
        <div className="row between g12">
          <div className="col g4"><h2 className="h3" id="h-be">{t('be.title')}</h2><span className="t-xs t-mute">{t('be.hint')}</span></div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>{t('be.close')}</button>
        </div>
        <div ref={tabsRef} className="seg seg-scroll" role="tablist">
          {TABS.map((k) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}>{t(`be.tab.${k}` as StringKey)}</button>)}
        </div>
        {tab === 'logos' && <LogosEdit brandId={brandId} logos={identity.logos} />}
        {tab === 'colors' && <ColorsEdit brandId={brandId} colors={identity.colors ?? []} />}
        {tab === 'type' && <FontsEdit brandId={brandId} fonts={identity.typography ?? []} />}
        {tab === 'concept' && <ImagesEdit brandId={brandId} field="concept" items={identity.concept ?? []} />}
        {tab === 'mockups' && <ImagesEdit brandId={brandId} field="mockups" items={identity.galleryAssets ?? []} />}
        {tab === 'primal' && <PrimalEdit brandId={brandId} primal={primal} />}
        {tab === 'voice' && <VoiceEdit brandId={brandId} voice={voice} />}
        {tab === 'strategy' && <StrategyEdit brandId={brandId} brain={brain} />}
      </div>
    </div>
  );
}
