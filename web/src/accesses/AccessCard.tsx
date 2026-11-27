import { useI18n } from '../i18n/I18nProvider';
import type { Access } from './useAccesses';
import { AppLogo } from './AppLogo';
import { DragHandle, LinkCell, PasswordCell, PlanCell, UserCell } from './AccessBits';
import { useSubline } from './AccessRow';
import type { DragItem } from './useDragOrder';

/** The same app as a card, for the grid view. */
export function AccessCard({ brandId, a, logo, drag, onEdit }: { brandId: string; a: Access; logo: string; drag: DragItem; onEdit: () => void }) {
  const { t } = useI18n();
  const sub = useSubline(a);
  return (
    <article className={`card acc-card col g12${drag.className}`} {...drag.bind} style={{ opacity: a.status && a.status !== 'active' ? 0.6 : 1 }}>
      <div className="row g12 min-w-0">
        <AppLogo name={a.platform} domain={logo} size={40} />
        <span className="col min-w-0 grow"><span className="w7 truncate">{a.platform}</span><span className="t-xs t-mute truncate">{sub}</span></span>
        {drag.enabled && <DragHandle label={t('apps.move', { name: a.platform })} onMove={drag.move} />}
      </div>
      <dl className="acc-card-fields">
        {/* Empty fields stay out (a «—» row said nothing, 2026-11-26); on phones each label sits over its value (apps.css). */}
        {a.username && <><dt>{t('acc.user')}</dt><dd><UserCell a={a} /></dd></>}
        <dt>{t('ct.a.how')}</dt><dd><PasswordCell brandId={brandId} a={a} onEdit={onEdit} /></dd>
        {a.link && <><dt>{t('acc.link')}</dt><dd><LinkCell a={a} /></dd></>}
        {(a.subscription || a.payer) && <><dt>{t('acc.subscription')}</dt><dd><PlanCell a={a} /></dd></>}
      </dl>
      <div className="row between g8 acc-card-foot">
        {a.group ? <span className="chip">{a.group}</span> : <span />}
        <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit} aria-label={`${t('acc.edit')} · ${a.platform}`}>{t('acc.edit')}</button>
      </div>
    </article>
  );
}
