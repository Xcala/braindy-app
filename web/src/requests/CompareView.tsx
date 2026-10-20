import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useFileUrl } from './useFileUrl';
import type { Version } from './types';

/** Compare two versions with a slider (design 14). */
export function CompareView({ brandId, requestId, versions, onClose }: { brandId: string; requestId: string; versions: Version[]; onClose: () => void }) {
  const { t } = useI18n();
  const [aId, setA] = useState(versions[versions.length - 2]?.id);
  const [bId, setB] = useState(versions[versions.length - 1]?.id);
  const [pos, setPos] = useState(50);
  const a = versions.find((v) => v.id === aId);
  const b = versions.find((v) => v.id === bId);
  const ua = useFileUrl(brandId, requestId, a);
  const ub = useFileUrl(brandId, requestId, b);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pick = (value: string | undefined, set: (id: string) => void, label: string) => (
    <select className="input" style={{ height: 40, width: 'auto' }} value={value} onChange={(e) => set(e.target.value)} aria-label={label}>
      {versions.map((v) => <option key={v.id} value={v.id}>v{v.n}</option>)}
    </select>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col p-4" style={{ background: 'var(--noche)' }} role="dialog" aria-modal="true" aria-label={t('req.compare')}>
      <div className="row between g12 wrap" style={{ color: '#fff', paddingBottom: 12 }}>
        <div className="row g12">{pick(aId, setA, t('req.left'))}<span>↔</span>{pick(bId, setB, t('req.right'))}</div>
        <button className="btn btn-outline-light btn-sm" onClick={onClose}><Icon name="x" />{t('common.cancel')}</button>
      </div>
      <div className="relative mx-auto flex min-h-0 flex-1 items-center justify-center">
        {ua && ub ? (
          <div className="relative inline-block">
            <img src={ub} alt={`v${b?.n}`} className="block max-h-[78vh] max-w-full" />
            <img src={ua} alt={`v${a?.n}`} className="absolute inset-0 block h-full w-full object-contain" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
            <span className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%`, width: 2, background: '#fff' }} />
            <span className="chip absolute left-3 top-3" style={{ background: '#fff' }}>v{a?.n}</span>
            <span className="chip absolute right-3 top-3" style={{ background: '#fff' }}>v{b?.n}</span>
          </div>
        ) : <div className="skel" style={{ width: 480, height: 480 }} />}
      </div>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label={t('req.slider')} className="mx-auto mt-3 w-full max-w-[640px]" />
    </div>
  );
}
