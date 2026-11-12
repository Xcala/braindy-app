import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useFileUrl, viewKind } from './useFileUrl';
import { useComments } from './useRequests';
import type { Version } from './types';
import { Scan } from '../components/Scan';

/** Compare two versions (design 14/27): slider, side by side, or only what changed. Same file of each version; videos side by side. */
export function CompareView({ brandId, requestId, versions, fileIndex = 0, onClose }: { brandId: string; requestId: string; versions: Version[]; fileIndex?: number; onClose: () => void }) {
  const { t } = useI18n();
  const [aId, setA] = useState(versions[versions.length - 2]?.id);
  const [bId, setB] = useState(versions[versions.length - 1]?.id);
  const [pos, setPos] = useState(50);
  const [mode, setMode] = useState<'slider' | 'side' | 'changes'>('slider');
  const comments = useComments(brandId, requestId);
  const a = versions.find((v) => v.id === aId);
  const b = versions.find((v) => v.id === bId);
  const fa = Math.min(fileIndex, Math.max(0, (a?.files?.length ?? 1) - 1));
  const fb = Math.min(fileIndex, Math.max(0, (b?.files?.length ?? 1) - 1));
  const ua = useFileUrl(brandId, requestId, a, fa);
  const ub = useFileUrl(brandId, requestId, b, fb);
  const video = viewKind(b?.files?.[fb]) === 'video' || viewKind(a?.files?.[fa]) === 'video';
  useEffect(() => { if (video && mode === 'slider') setMode('side'); }, [video, mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pick = (value: string | undefined, set: (id: string) => void, label: string) => (
    <select className="input" style={{ height: '2.5rem', width: 'auto' }} value={value} onChange={(e) => set(e.target.value)} aria-label={label}>
      {versions.map((v) => <option key={v.id} value={v.id}>v{v.n}</option>)}
    </select>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col p-4" style={{ background: 'var(--noche)' }} role="dialog" aria-modal="true" aria-label={t('req.compare')}>
      <div className="row between g12 wrap" style={{ color: '#fff', paddingBottom: '0.75rem' }}>
        <div className="row g12 wrap">{pick(aId, setA, t('req.left'))}<span>↔</span>{pick(bId, setB, t('req.right'))}
          <div className="seg" role="group" aria-label={t('req.compareMode')}>
            {(video ? (['side', 'changes'] as const) : (['slider', 'side', 'changes'] as const)).map((m) => <button key={m} className={mode === m ? 'is-on' : ''} aria-pressed={mode === m} onClick={() => setMode(m)}>{t(`req.mode.${m}`)}</button>)}
          </div></div>
        <button className="btn btn-outline-light btn-sm" onClick={onClose}><Icon name="x" />{t('common.cancel')}</button>
      </div>
      <div className="relative mx-auto flex min-h-0 flex-1 items-center justify-center">
        {mode === 'side' && ua && ub ? (
          <div className="grid w-full gap-4 md:grid-cols-2">
            {[[a, ua], [b, ub]].map(([v, u]) => (
              <figure key={(v as Version).id} className="relative m-0 flex items-center justify-center">
                {video ? <video src={u as string} controls className="block max-h-[74vh] max-w-full" />
                  : <img src={u as string} alt={`v${(v as Version).n}`} className="block max-h-[74vh] max-w-full" />}
                <span className="chip absolute left-3 top-3" style={{ background: '#fff' }}>v{(v as Version).n}</span>
              </figure>
            ))}
          </div>
        ) : mode === 'changes' ? (
          <div className="card col g12 w-full max-w-[40rem]" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
            <h2 className="h3">{t('req.changesTitle', { a: String(a?.n ?? ''), b: String(b?.n ?? '') })}</h2>
            {b?.notes && <Scan text={b.notes} points />}
            {b?.reason && <div className="col g4"><p className="label">{t('req.whyItWorks')}</p><Scan text={b.reason} points tone="ink" /></div>}
            <p className="label">{t('req.askedOn', { n: String(a?.n ?? '') })}</p>
            {comments.filter((c) => c.versionId === a?.id).map((c) => <p key={c.id} className="t-sm" style={{ borderLeft: '3px solid var(--line)', paddingLeft: '0.625rem' }}>{c.text}</p>)}
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
        ) : <div className="skel" style={{ width: '30rem', height: '30rem' }} />}
      </div>
      {mode === 'slider' && <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label={t('req.slider')} className="mx-auto mt-3 w-full max-w-[40rem]" onKeyDown={(e) => { if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); setPos((p) => Math.max(0, Math.min(100, p + (e.key === 'ArrowRight' ? 25 : -25)))); } }} step={5} />}
    </div>
  );
}
