import { useI18n } from '../i18n/I18nProvider';
import type { BrandRequest } from './types';

const STEPS = ['request', 'plan', 'planApproved', 'work', 'clientApproval', 'published'] as const;

/** Six-step progress from the design: request · plan · plan approved · work · your approval · published. */
export function Progress({ r }: { r: BrandRequest }) {
  const { t } = useI18n();
  const reached = r.stage === 'published' ? 6 : r.stage === 'approved' ? 5 : r.stage === 'clientApproval' ? 4 : r.stage === 'work' ? 3 : r.plan ? 2 : 1;
  return (
    <div className="grid w-full grid-cols-6 gap-1.5 sm:w-[520px]" role="img" aria-label={t(`req.step.${STEPS[Math.min(reached, 5)]}`)}>
      {STEPS.map((s, i) => (
        <span key={s} style={{ height: 6, borderRadius: 999, background: i < reached ? 'var(--success)' : i === reached ? 'var(--azul)' : 'var(--line)' }} />
      ))}
      <span className="t-xs t-mute col-span-4">{t('req.progressDone')}</span>
      <span className="t-xs w7 col-span-2" style={{ color: 'var(--azul)' }}>{t(`req.step.${STEPS[Math.min(reached, 5)]}`)}</span>
    </div>
  );
}
