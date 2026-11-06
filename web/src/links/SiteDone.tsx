import { useState } from 'react';
import type { Timestamp } from 'firebase/firestore';
import { useI18n } from '../i18n/I18nProvider';
import type { SiteChange } from './SiteChanges';
import { Point } from './SitePoint';
import { CommentItem, type SiteComment } from './SiteComments';
import type { SiteFrame } from './useSpot';

type Row = { id: string; at: number; ts?: Timestamp } & ({ kind: 'adjust'; x: SiteChange } | { kind: 'comment'; c: SiteComment });

/**
 * "Delivered" tab: everything that already happened, newest first: delivered adjustments and resolved comments,
 * each with its date and a label saying which one it is.
 */
export function SiteDone({ brandId, points, comments, frame }: { brandId: string; points: SiteChange[]; comments: SiteComment[]; frame?: SiteFrame }) {
  const { t, lang } = useI18n();
  const [openComment, setOpenComment] = useState<string | null>(null);
  const rows: Row[] = [
    ...points.filter((x) => x.status === 'delivered').map((x): Row => ({ id: x.id, kind: 'adjust', x, ts: x.updatedAt, at: x.updatedAt?.toMillis() ?? 0 })),
    ...comments.filter((c) => c.resolved).map((c): Row => ({ id: c.id, kind: 'comment', c, ts: c.resolvedAt, at: c.resolvedAt?.toMillis() ?? 0 })),
  ].sort((a, b) => b.at - a.at);
  const when = (ts?: Timestamp) => ts?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }) ?? '';

  if (rows.length === 0) return <p className="t-sm t-mute" style={{ margin: 0 }}>{t('sp.doneEmpty')}</p>;
  return (
    <div className="col g8">
      {rows.map((r) => (
        <div key={`${r.kind}-${r.id}`} className="col g4">
          <p className="label sdone-kind" style={{ margin: 0 }}>{t(r.kind === 'adjust' ? 'sp.kindAdjust' : 'sp.kindComment')}{r.ts ? ` · ${when(r.ts)}` : ''}</p>
          {r.kind === 'adjust'
            ? <Point brandId={brandId} x={r.x} onShow={frame?.go} on={frame?.active === r.x.key} />
            : <CommentItem brandId={brandId} c={r.c} frame={frame} open={openComment === r.c.id} onOpen={setOpenComment} />}
        </div>
      ))}
    </div>
  );
}
