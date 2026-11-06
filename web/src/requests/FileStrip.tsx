import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useFileUrl, viewKind, type ViewKind } from './useFileUrl';
import type { Version } from './types';

const ORDER: ViewKind[] = ['image', 'video', 'pdf', 'text', 'other'];
const ext = (name: string) => (name.match(/\.([^.]+)$/)?.[1] ?? '').toUpperCase();

/** The files of a version as small tiles grouped by kind ("8 slides", "PDF", "Text"); the name shows on hover. */
export function FileStrip({ brandId, requestId, v, index, onPick }: { brandId: string; requestId: string; v: Version; index: number; onPick: (i: number) => void }) {
  const { t } = useI18n();
  const groups = ORDER.map((k) => ({ k, items: v.files.map((f, i) => ({ f, i })).filter(({ f }) => viewKind(f) === k) })).filter((g) => g.items.length);
  const label = (k: ViewKind, n: number) => k === 'image' ? (n > 1 ? t('vw.slides', { n }) : t('vw.image')) : `${t(`vw.${k}`)}${n > 1 ? ` · ${n}` : ''}`;
  return (
    <div className="vw-strip" role="tablist" aria-label={t('vw.files')}>
      {groups.map((g) => (
        <div key={g.k} className="vw-group">
          <span className="t-xs t-mute w7">{label(g.k, g.items.length)}</span>
          <div className="row g8">
            {g.items.map(({ f, i }, n) => (
              <Tile key={i} brandId={brandId} requestId={requestId} v={v} i={i} on={i === index} onPick={onPick}
                kind={g.k} name={f.name} n={g.items.length > 1 ? String(n + 1).padStart(2, '0') : ''} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Tile({ brandId, requestId, v, i, on, onPick, kind, name, n }: { brandId: string; requestId: string; v: Version; i: number; on: boolean; onPick: (i: number) => void; kind: ViewKind; name: string; n: string }) {
  const url = useFileUrl(brandId, requestId, kind === 'image' ? v : undefined, i);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (on) ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [on]);
  return (
    <button ref={ref} type="button" role="tab" aria-selected={on} title={name} aria-label={name} className={`vw-tile${on ? ' is-on' : ''}`} onClick={() => onPick(i)}>
      {kind === 'image'
        ? (url ? <img src={url} alt="" loading="lazy" draggable={false} /> : <span className="skel" style={{ width: '100%', height: '100%' }} />)
        : <span className="vw-ico"><Icon name={kind === 'video' ? 'external' : 'file'} size={20} /><span className="t-xs w7">{ext(name) || '·'}</span></span>}
      {n && <span className="vw-n">{n}</span>}
    </button>
  );
}
