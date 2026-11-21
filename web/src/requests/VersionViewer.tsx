import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useFileUrl, viewKind, markFile } from './useFileUrl';
import { downloadVersionZip, versionFileUrl } from './api';
import { FileStrip } from './FileStrip';
import { FileBody } from './FileBody';
import { Popover } from './Popover';
import { VideoMarks } from './VideoMarks';
import { ZoomView } from './ZoomView';
import type { Annotation, RequestComment, Version } from './types';
import './viewer.css';

/**
 * Piece viewer with version tabs and "mark on piece": drag a box, then comment on it. A version with several files
 * gets arrows (and ← →, and a swipe on phones), a "3 of 10" counter and a strip of tiles; marks belong to one file.
 */
export function VersionViewer({ brandId, requestId, versions, current, onPick, fileIndex, onFile, comments, onMark, onCompare, seek }: {
  brandId: string; requestId: string; versions: Version[]; current?: Version; onPick: (id: string) => void;
  fileIndex: number; onFile: (i: number) => void;
  comments: RequestComment[]; onMark: (a: Annotation) => void; onCompare: () => void;
  /** A comment asked to see its moment of the video (n changes on every ask, so the same moment can be asked twice). */
  seek?: { t: number; n: number } | null;
}) {
  const { t, lang } = useI18n();
  const [marking, setMarking] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [draft, setDraft] = useState<{ x0: number; y0: number; x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const swipe = useRef<number | null>(null);
  const player = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const count = current?.files?.length ?? 0;
  const file = current?.files?.[fileIndex];
  const kind = viewKind(file);
  const url = useFileUrl(brandId, requestId, current, fileIndex);
  const go = (d: number) => { const i = fileIndex + d; if (i >= 0 && i < count) { onFile(i); setMarking(false); } };

  useEffect(() => {
    if (count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target;
      if (marking || (el instanceof Element && el.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]'))) return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const seekTo = (t: number) => { const p = player.current; if (p) { p.currentTime = t; p.pause(); } };
  useEffect(() => { if (seek) seekTo(seek.t); }, [seek?.n]); // eslint-disable-line react-hooks/exhaustive-deps
  const markMoment = () => {
    const p = player.current;
    if (!p || !current) return;
    p.pause();
    onMark({ x: 0, y: 0, w: 0, h: 0, versionId: current.id, fileIndex, t: Math.round(p.currentTime * 10) / 10 });
  };
  const pos = (e: PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)) };
  };
  const up = () => {
    if (draft && current) {
      const a = { x: Math.min(draft.x0, draft.x), y: Math.min(draft.y0, draft.y), w: Math.abs(draft.x - draft.x0), h: Math.abs(draft.y - draft.y0), versionId: current.id, fileIndex };
      onMark(a.w < 2 || a.h < 2 ? { ...a, w: 0, h: 0 } : a);
      setMarking(false);
    }
    setDraft(null);
  };
  const onThis = comments.filter((c) => c.annotation && c.annotation.versionId === current?.id && markFile(c.annotation) === fileIndex);
  const pins = onThis.filter((c) => typeof c.annotation!.t !== 'number');
  const state = (v: Version): 'approved' | 'changes' | 'review' | null => (v.approval?.state === 'approved' ? 'approved' : v.approval?.state === 'changes_requested' ? 'changes' : v.published ? 'review' : null);
  const date = (v: Version) => (v.publishedAt ?? v.createdAt)?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });
  const getOne = async () => { if (current) window.location.assign(await versionFileUrl(brandId, requestId, current.id, fileIndex, true)); };

  return (
    <div className="col min-w-0 vw-stage">
      <div className="vw-bar">
        <div className="seg vw-tabs" role="tablist" aria-label={t('req.versions')}>
          {versions.map((v) => {
            const st = state(v);
            const label = st ? t(`vs.${st}`) : undefined;
            return (
              <button key={v.id} role="tab" aria-selected={v.id === current?.id} className={v.id === current?.id ? 'is-on' : ''} onClick={() => { onPick(v.id); onFile(0); }} title={label}>
                v{v.n}{date(v) ? ` · ${date(v)}` : ''}{st && <span className={`vs-dot is-${st}`} role="img" aria-label={label} />}
              </button>
            );
          })}
        </div>
        {/* Phones: one compact picker showing the version in view (cut-off tabs read as clutter, 2026-11-21). */}
        <select className="input vw-vsel" aria-label={t('req.versions')} value={current?.id ?? ''} onChange={(e) => { onPick(e.target.value); onFile(0); }}>
          {versions.map((v) => { const st = state(v); return <option key={v.id} value={v.id}>{`v${v.n}${date(v) ? ` · ${date(v)}` : ''}${st ? ` · ${t(`vs.${st}`)}` : ''}`}</option>; })}
        </select>
        <div className="vw-acts">
          {count > 1 && <span className="vw-count" aria-live="polite">{t('vw.counter', { i: fileIndex + 1, n: count })}</span>}
          {kind === 'image' && <button data-tour="review-mark" className="btn btn-ghost btn-sm" aria-pressed={marking} style={marking ? { background: 'var(--hielo)' } : undefined} onClick={() => setMarking((m) => !m)} aria-label={t('req.markOnPiece')} title={t('req.markOnPiece')}><Icon name="pencil" size={16} /><span className="vw-lbl">{t('req.markOnPiece')}</span></button>}
          {kind === 'video' && <button className="btn btn-ghost btn-sm" onClick={markMoment} aria-label={t('vm.commentHere')} title={t('vm.commentHere')}><Icon name="pencil" size={16} /><span className="vw-lbl">{t('vm.commentHere')}</span></button>}
          {versions.length > 1 && (kind === 'image' || kind === 'video') && <button data-tour="review-compare" className="btn btn-ghost btn-sm" onClick={onCompare} aria-label={t('req.compare')} title={t('req.compare')}><Icon name="grid" size={16} /><span className="vw-lbl">{t('req.compare')}</span></button>}
          {current && file && (count > 1 ? (
            <Popover align="right" className="btn btn-ghost btn-sm" label={<><Icon name="download" /><span className="vw-lbl">{t('common.download')}</span><Icon name="chevronDown" size={14} /></>}>
              {(close) => (
                <div className="col g8">
                  <button className="btn btn-secondary btn-sm" onClick={() => { close(); void getOne(); }}>{t('vw.thisFile')}</button>
                  <button className="btn btn-primary btn-sm" onClick={() => { close(); void downloadVersionZip(brandId, requestId, current.id, `v${current.n}`); }}>{t('vw.all')}</button>
                </div>
              )}
            </Popover>
          ) : <button className="btn btn-ghost btn-sm" onClick={getOne} aria-label={t('common.download')} title={t('common.download')}><Icon name="download" /><span className="vw-lbl">{t('common.download')}</span></button>)}
        </div>
      </div>
      <div className="vw-stage flex min-h-[12rem] flex-1 items-center justify-center p-3 sm:min-h-[26.25rem] sm:px-16 sm:py-7"
        onTouchStart={(e) => { swipe.current = marking ? null : e.touches[0]!.clientX; }}
        onTouchEnd={(e) => { if (swipe.current === null) return; const dx = e.changedTouches[0]!.clientX - swipe.current; swipe.current = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}>
        {count > 1 && <button className="vw-arrow is-prev" aria-label={t('vw.prev')} disabled={fileIndex === 0} onClick={() => go(-1)}><Icon name="arrowLeft" size={18} /></button>}
        {!url && kind !== 'text' ? <div className="skel" style={{ width: '60%', height: '22.5rem' }} /> : kind === 'image' ? (
          <div ref={box} className="relative select-none" style={{ cursor: marking ? 'crosshair' : 'zoom-in', touchAction: marking ? 'none' : 'auto' }}
            onPointerDown={(e) => { if (marking) { const p = pos(e); setDraft({ x0: p.x, y0: p.y, ...p }); } }}
            onPointerMove={(e) => draft && setDraft({ ...draft, ...pos(e) })} onPointerUp={up}>
            <img src={url ?? undefined} alt={file?.name} draggable={false} title={marking ? undefined : t('vw.zoomOpen')} onClick={() => { if (!marking && url) setZoomed(true); }} className="block max-h-[70vh] max-w-full rounded-lg" style={{ boxShadow: 'var(--sh-2)' }} />
            {pins.map((c, i) => <Pin key={c.id} a={c.annotation!} n={i + 1} resolved={c.resolved} />)}
            {draft && <span className="absolute" style={{ left: `${Math.min(draft.x0, draft.x)}%`, top: `${Math.min(draft.y0, draft.y)}%`, width: `${Math.abs(draft.x - draft.x0)}%`, height: `${Math.abs(draft.y - draft.y0)}%`, border: '2px dashed var(--azul)', borderRadius: '0.625rem', background: 'rgba(47,77,224,.08)' }} />}
          </div>
        ) : kind === 'video' ? (
          <div className="vm-wrap">
            <video ref={player} src={url ?? undefined} controls className="mx-auto max-h-[70vh] max-w-full rounded-lg" onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)} />
            <VideoMarks comments={onThis} duration={duration} onSeek={seekTo} />
          </div>
        )
          : current && file && <FileBody brandId={brandId} requestId={requestId} versionId={current.id} index={fileIndex} file={file} kind={kind} url={url ?? ''} onDownload={getOne} />}
        {count > 1 && <button className="vw-arrow is-next" aria-label={t('vw.next')} disabled={fileIndex === count - 1} onClick={() => go(1)}><Icon name="arrowRight" size={18} /></button>}
      </div>
      {zoomed && url && kind === 'image' && <ZoomView url={url} name={file?.name} onClose={() => setZoomed(false)} />}
      {count > 1 && current && <FileStrip brandId={brandId} requestId={requestId} v={current} index={fileIndex} onPick={(i) => { onFile(i); setMarking(false); }} />}
    </div>
  );
}

function Pin({ a, n, resolved }: { a: Annotation; n: number; resolved?: boolean }) {
  const color = resolved ? 'var(--success)' : 'var(--azul)';
  return (
    <>
      {a.w > 0 && <span className="pointer-events-none absolute" style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%`, height: `${a.h}%`, border: `2px dashed ${color}`, borderRadius: '0.625rem', background: resolved ? 'transparent' : 'rgba(47,77,224,.08)' }} />}
      <span className="pointer-events-none absolute flex items-center justify-center" style={{ left: `calc(${a.x + a.w}% - 16px)`, top: `calc(${a.y}% - 16px)`, width: '2rem', height: '2rem', borderRadius: '50% 50% 50% 0.25rem', background: color, color: '#fff', font: '800 0.8125rem/1 var(--f-text)', boxShadow: '0 0 0 3px #fff, var(--sh-2)' }}>
        {resolved ? <Icon name="check" size={14} /> : n}
      </span>
    </>
  );
}
