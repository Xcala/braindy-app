import { useRef, useState, type PointerEvent } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useFileUrl, isImage, isVideo } from './useFileUrl';
import { versionFileUrl } from './api';
import type { Annotation, RequestComment, Version } from './types';

/** Piece viewer with version tabs and "mark on piece": drag a box, then comment on it. */
export function VersionViewer({ brandId, requestId, versions, current, onPick, comments, onMark, onCompare }: {
  brandId: string; requestId: string; versions: Version[]; current?: Version; onPick: (id: string) => void;
  comments: RequestComment[]; onMark: (a: Annotation) => void; onCompare: () => void;
}) {
  const { t, lang } = useI18n();
  const [fileIndex, setFileIndex] = useState(0);
  const [marking, setMarking] = useState(false);
  const [draft, setDraft] = useState<{ x0: number; y0: number; x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const file = current?.files?.[fileIndex];
  const url = useFileUrl(brandId, requestId, current, fileIndex);

  const pos = (e: PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)) };
  };
  const up = () => {
    if (draft && current) {
      const a = { x: Math.min(draft.x0, draft.x), y: Math.min(draft.y0, draft.y), w: Math.abs(draft.x - draft.x0), h: Math.abs(draft.y - draft.y0), versionId: current.id };
      onMark(a.w < 2 || a.h < 2 ? { ...a, w: 0, h: 0 } : a);
      setMarking(false);
    }
    setDraft(null);
  };
  const pins = comments.filter((c) => c.annotation && c.annotation.versionId === current?.id);
  const date = (v: Version) => (v.publishedAt ?? v.createdAt)?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="col min-w-0" style={{ background: 'var(--niebla)' }}>
      <div className="row between g8 wrap" style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
        <div className="seg" role="tablist" aria-label={t('req.versions')}>
          {versions.map((v) => <button key={v.id} role="tab" aria-selected={v.id === current?.id} className={v.id === current?.id ? 'is-on' : ''} onClick={() => { onPick(v.id); setFileIndex(0); }}>v{v.n}{date(v) ? ` · ${date(v)}` : ''}</button>)}
        </div>
        <div className="row g8 wrap">
          {isImage(file?.contentType) && <button className="btn btn-ghost btn-sm" aria-pressed={marking} style={marking ? { background: 'var(--hielo)' } : undefined} onClick={() => setMarking((m) => !m)}>{t('req.markOnPiece')}</button>}
          {versions.length > 1 && isImage(file?.contentType) && <button className="btn btn-ghost btn-sm" onClick={onCompare}>{t('req.compare')}</button>}
          {current && file && <button className="btn btn-ghost btn-sm" onClick={async () => window.location.assign(await versionFileUrl(brandId, requestId, current.id, fileIndex, true))}><Icon name="download" />{t('common.download')}</button>}
        </div>
      </div>
      <div className="flex min-h-[420px] flex-1 items-center justify-center p-4 sm:p-7">
        {!url ? <div className="skel" style={{ width: '60%', height: 360 }} /> : isImage(file?.contentType) ? (
          <div ref={box} className="relative select-none" style={{ cursor: marking ? 'crosshair' : 'default', touchAction: marking ? 'none' : 'auto' }}
            onPointerDown={(e) => { if (marking) { const p = pos(e); setDraft({ x0: p.x, y0: p.y, ...p }); } }}
            onPointerMove={(e) => draft && setDraft({ ...draft, ...pos(e) })} onPointerUp={up}>
            <img src={url} alt={file?.name} draggable={false} className="block max-h-[70vh] max-w-full rounded-lg" style={{ boxShadow: 'var(--sh-2)' }} />
            {pins.map((c, i) => <Pin key={c.id} a={c.annotation!} n={i + 1} resolved={c.resolved} />)}
            {draft && <span className="absolute" style={{ left: `${Math.min(draft.x0, draft.x)}%`, top: `${Math.min(draft.y0, draft.y)}%`, width: `${Math.abs(draft.x - draft.x0)}%`, height: `${Math.abs(draft.y - draft.y0)}%`, border: '2px dashed var(--azul)', borderRadius: 10, background: 'rgba(47,77,224,.08)' }} />}
          </div>
        ) : isVideo(file?.contentType) ? <video src={url} controls className="max-h-[70vh] max-w-full rounded-lg" />
          : <a className="btn btn-secondary" href={url} target="_blank" rel="noreferrer">{t('common.open')} {file?.name}</a>}
      </div>
      {(current?.files?.length ?? 0) > 1 && (
        <div className="row g8 wrap" style={{ padding: '0 20px 16px' }}>
          {current!.files.map((f, i) => <button key={i} className={`btn btn-sm ${i === fileIndex ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFileIndex(i)}>{f.name}</button>)}
        </div>
      )}
    </div>
  );
}

function Pin({ a, n, resolved }: { a: Annotation; n: number; resolved?: boolean }) {
  const color = resolved ? 'var(--success)' : 'var(--azul)';
  return (
    <>
      {a.w > 0 && <span className="pointer-events-none absolute" style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%`, height: `${a.h}%`, border: `2px dashed ${color}`, borderRadius: 10, background: resolved ? 'transparent' : 'rgba(47,77,224,.08)' }} />}
      <span className="pointer-events-none absolute flex items-center justify-center" style={{ left: `calc(${a.x + a.w}% - 16px)`, top: `calc(${a.y}% - 16px)`, width: 32, height: 32, borderRadius: '50% 50% 50% 4px', background: color, color: '#fff', font: '800 13px/1 var(--f-text)', boxShadow: '0 0 0 3px #fff, var(--sh-2)' }}>
        {resolved ? <Icon name="check" size={14} /> : n}
      </span>
    </>
  );
}
