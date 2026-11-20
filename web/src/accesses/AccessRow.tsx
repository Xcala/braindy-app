import type { StringKey } from '../i18n/strings';
import { useI18n } from '../i18n/I18nProvider';
import type { Access } from './useAccesses';
import { AppLogo } from './AppLogo';
import { DragHandle, LinkCell, PasswordCell, PlanCell, UserCell } from './AccessBits';
import type { DragItem } from './useDragOrder';

export { priceLabel } from './AccessBits';
export type AccessCol = 'user' | 'password' | 'link' | 'plan' | 'notes';
export const ALL_COLS: AccessCol[] = ['user', 'password', 'link', 'plan', 'notes'];
const WIDTH: Record<AccessCol, string> = { user: 'minmax(0,1fr)', password: 'minmax(0,1.3fr)', link: 'minmax(0,0.9fr)', plan: 'minmax(0,0.9fr)', notes: 'minmax(0,1fr)' };
export const COL_LABEL: Record<AccessCol, StringKey> = { user: 'acc.user', password: 'acc.password', link: 'acc.link', plan: 'acc.subscription', notes: 'acc.notes' };

/** Grid template for the visible columns: platform first, the edit action last. */
export const gridFor = (cols: AccessCol[]) => ['minmax(0,1fr)', ...cols.map((c) => WIDTH[c]), '84px'].join(' ');

/** The line under the app's name: shared with Braindy, or when and who changed it last. */
export function useSubline(a: Access) {
  const { t, lang } = useI18n();
  const date = a.updatedAt?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' });
  if (a.purpose) return a.status && a.status !== 'active' ? `${t(a.status === 'paused' ? 'acc.statusPaused' : 'acc.statusCancelled')} · ${a.purpose}` : a.purpose;
  return a.sharedWithBraindy ? t('acc.shared') : [date, a.updatedByName].filter(Boolean).join(' · ');
}

/** App row: each visible column copies on its own; the password reveals in place for 30 s (logged). */
export function AccessRow({ brandId, a, cols, logo, drag, onEdit }: { brandId: string; a: Access; cols: AccessCol[]; logo: string; drag: DragItem; onEdit: () => void }) {
  const { t } = useI18n();
  const sub = useSubline(a);
  const cell: Record<AccessCol, React.ReactNode> = {
    user: <UserCell a={a} />,
    password: <PasswordCell brandId={brandId} a={a} onEdit={onEdit} />,
    link: <LinkCell a={a} />,
    plan: <PlanCell a={a} />,
    notes: <span className="t-sm t-mute truncate" title={a.notes}>{a.notes || '—'}</span>,
  };

  return (
    <div className={`trow acc-row${drag.className}`} {...drag.bind} style={{ opacity: a.status && a.status !== 'active' ? 0.6 : 1,  gridTemplateColumns: gridFor(cols), minHeight: '4rem', minWidth: `${(260 + cols.length * 170) / 16}rem` }}>
      <span className="row g12 min-w-0">
        {drag.enabled && <DragHandle label={t('apps.move', { name: a.platform })} onMove={drag.move} />}
        <AppLogo name={a.platform} domain={logo} />
        <span className="col min-w-0"><span className="w7 truncate">{a.platform}</span><span className="t-xs t-mute truncate">{sub}</span></span>
      </span>
      {cols.map((c) => <div key={c} className="acc-cell min-w-0" data-label={t(COL_LABEL[c])}>{cell[c]}</div>)}
      <button type="button" className="btn btn-ghost btn-sm justify-self-end" onClick={onEdit} aria-label={`${t('acc.edit')} · ${a.platform}`}>{t('acc.edit')}</button>
    </div>
  );
}
