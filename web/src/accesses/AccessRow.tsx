import { useState } from 'react';
import type { StringKey } from '../i18n/strings';
import { useI18n } from '../i18n/I18nProvider';
import type { Access } from './useAccesses';
import { AppLogo } from './AppLogo';
import { DragHandle, HowLine, LinkCell, PasswordCell, PlanCell, UserCell } from './AccessBits';
import type { DragItem } from './useDragOrder';

export { priceLabel } from './AccessBits';
export type AccessCol = 'user' | 'password' | 'link' | 'plan' | 'notes';
export const ALL_COLS: AccessCol[] = ['user', 'password', 'link', 'plan', 'notes'];
const WIDTH: Record<AccessCol, string> = { user: 'minmax(0,1fr)', password: 'minmax(0,1.3fr)', link: 'minmax(0,0.9fr)', plan: 'minmax(0,0.9fr)', notes: 'minmax(0,1fr)' };
export const COL_LABEL: Record<AccessCol, StringKey> = { user: 'acc.user', password: 'ct.a.how', link: 'acc.link', plan: 'acc.subscription', notes: 'acc.notes' };

/** A column with nothing in any app is left out (audit C3: an empty «Subscription» column took a fifth of the table). */
const FILLED: Record<AccessCol, (a: Access) => boolean> = { user: (a) => !!a.username, password: () => true, link: (a) => !!a.link, plan: (a) => !!(a.subscription || a.payer), notes: (a) => !!a.notes };
export const filledCols = (cols: AccessCol[], list: Access[]) => cols.filter((c) => list.some(FILLED[c]));

/** Grid template for the visible columns: platform first, the edit action last. */
export const gridFor = (cols: AccessCol[]) => ['minmax(0,1fr)', ...cols.map((c) => WIDTH[c]), '84px'].join(' ');

/** The line under the app's name: what it is for, or that it is shared with Braindy. Nothing else (the old «date · who»
 *  line is in the safety log, audit C3). */
export function useSubline(a: Access) {
  const { t } = useI18n();
  if (a.purpose) return a.status && a.status !== 'active' ? `${t(a.status === 'paused' ? 'acc.statusPaused' : 'acc.statusCancelled')} · ${a.purpose}` : a.purpose;
  return a.sharedWithBraindy ? t('acc.shared') : '';
}

/** App row: each visible column copies on its own; the password reveals in place for 30 s (logged). On phones the row is
 *  one line (logo, name, how you get in) that opens to the fields (audit C4). */
export function AccessRow({ brandId, a, cols, logo, drag, onEdit }: { brandId: string; a: Access; cols: AccessCol[]; logo: string; drag: DragItem; onEdit: () => void }) {
  const { t } = useI18n();
  const sub = useSubline(a);
  const [open, setOpen] = useState(false);
  const cell: Record<AccessCol, React.ReactNode> = {
    user: <UserCell a={a} />,
    password: <PasswordCell brandId={brandId} a={a} onEdit={onEdit} />,
    link: <LinkCell a={a} />,
    plan: <PlanCell a={a} />,
    notes: <span className="t-sm t-mute truncate" title={a.notes}>{a.notes || '—'}</span>,
  };

  return (
    <div className={`trow acc-row${open ? ' is-open' : ''}${drag.className}`} {...drag.bind} style={{ opacity: a.status && a.status !== 'active' ? 0.6 : 1,  gridTemplateColumns: gridFor(cols), minHeight: '4rem', minWidth: `${(260 + cols.length * 170) / 16}rem` }}>
      <span className="row g12 min-w-0">
        {drag.enabled && <DragHandle label={t('apps.move', { name: a.platform })} onMove={drag.move} />}
        <AppLogo name={a.platform} domain={logo} />
        <span className="col min-w-0">
          <span className="w7" style={{ overflowWrap: 'anywhere' }}>{a.platform}</span>
          {sub && <span className="t-xs t-mute truncate acc-sub">{sub}</span>}
          <span className="acc-sum"><HowLine a={a} /></span>
        </span>
      </span>
      {cols.map((c) => <div key={c} className="acc-cell min-w-0" data-label={t(COL_LABEL[c])}>{cell[c]}</div>)}
      <button type="button" className="btn btn-ghost btn-sm justify-self-end acc-edit" onClick={onEdit} aria-label={`${t('acc.edit')} · ${a.platform}`}>{t('acc.edit')}</button>
      <button type="button" className="acc-toggle" aria-expanded={open} aria-label={`${a.platform} · ${t(open ? 'acc.hide' : 'ct.a.open')}`} onClick={() => setOpen((x) => !x)}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
    </div>
  );
}
