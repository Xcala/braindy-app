import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useFileUrl } from './useFileUrl';
import { useComments } from './useRequests';
import type { Version } from './types';

/** Compare two versions (design 14/27): slider, side by side, or only what changed. */
export function CompareView({ brandId, requestId, versions, onClose }: { brandId: string; requestId: string; versions: Version[]; onClose: () => void }) {
  const { t } = useI18n();
  const [aId, setA] = useState(versions[versions.length - 2]?.id);
  const [bId, setB] = useState(versions[versions.length - 1]?.id);
  const [pos, setPos] = useState(50);
  const [mode, setMode] = useState<'slider' | 'side' | 'changes'>('slider');
  const comments = useComments(brandId, requestId);
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
        <div className="row g12 wrap">{pick(aId, setA, t('req.left'))}<span>↔</span>{pick(bId, setB, t('req.right'))}
          <div className="seg" role="group" aria-label={t('req.compareMode')}>
            {(['slider', 'side', 'changes'] as const).map((m) => <button key={m} className={mode === m ? 'is-on' : ''} aria-pressed={mode === m} onClick={() => setMode(m)}>{t(`req.mode.${m}`)}</button>)}
          </div></div>
        <button className="btn btn-outline-light btn-sm" onClick={onClose}><Icon name="x" />{t('common.cancel')}</button>
      </div>
      <div className="relative mx-auto flex min-h-0 flex-1 items-center justify-center">
        {mode === 'side' && ua && ub ? (
          <div className="grid w-full gap-4 md:grid-cols-2">
            {[[a, ua], [b, ub]].map(([v, u]) => (
              <figure key={(v as Version).id} className="relative m-0 flex items-center justify-center">
                <img src={u as string} alt={`v${(v as Version).n}`} className="block max-h-[74vh] max-w-full" />
                <span className="chip absolute left-3 top-3" style={{ background: '#fff' }}>v{(v as Version).n}</span>
              </figure>
            ))}
          </div>
        ) : mode === 'changes' ? (
          <div className="card col g12 w-full max-w-[640px]" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
            <h2 className="h3">{t('req.changesTitle', { a: String(a?.n ?? ''), b: String(b?.n ?? '') })}</h2>
            {b?.notes && <p className="t-sm">{b.notes}</p>}
            {b?.reason && <div className="col g4"><p className="label">{t('req.whyItWorks')}</p><p className="t-sm">{b.reason}</p></div>}
            <p className="label">{t('req.askedOn', { n: String(a?.n ?? '') })}</p>
            {comments.filter((c) => c.versionId === a?.id).map((c) => <p key={c.id} className="t-sm" style={{ borderLeft: '3px solid var(--line)', paddingLeft: 10 }}>{c.text}</p>)}
            {!comments.some((c) => c.versionId === a?.id) && <p className="t-sm t-mute">{t('req.noChangesAsked')}</p>}
          </div>
        ) : ua && ub ? (
          <div className="relative inline-block">
            <img src={ub} alt={`v${b?.n}`} className="block max-h-[78vh] max-w-full" />
            <img src={ua} alt={`v${a?.n}`} className="absolute inset-0 block h-full w-full object-contain" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
            <span className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%`, width: 2, background: '#fff' }} />
            <span className="chip absolute left-3 top-3" style={{ background: '#fff' }}>v{a?.n}</span>
            <span className="chip absolute right-3 top-3" style={{ background: '#fff' }}>v{b?.n}</span>
          </div>
        ) : <div className="skel" style={{ width: 480, height: 480 }} />}
      </div>
      {mode === 'slider' && <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label={t('req.slider')} className="mx-auto mt-3 w-full max-w-[640px]" onKeyDown={(e) => { if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); setPos((p) => Math.max(0, Math.min(100, p + (e.key === 'ArrowRight' ? 25 : -25)))); } }} step={5} />}
    </div>
  );
}
