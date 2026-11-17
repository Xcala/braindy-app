import { useI18n } from '../i18n/I18nProvider';
import type { OnboardingStep } from '../brands/BrandProvider';
import type { StringKey } from '../i18n/strings';

const STEPS: Array<{ id: 'contract' | 'kickoff' | 'strategy'; title: StringKey; sub: StringKey }> = [
  { id: 'contract', title: 'ctr.s.contract', sub: 'ctr.s.contractSub' },
  { id: 'kickoff', title: 'ctr.s.kickoff', sub: 'ctr.s.kickoffSub' },
  { id: 'strategy', title: 'ctr.s.strategy', sub: 'ctr.s.strategySub' },
];

/** Which of the 3 steps a brand is on (the strategy step holds brief → Brand Brain → session → first delivery). */
export const stepIndex = (step: OnboardingStep) => (step === 'contract' ? 0 : step === 'kickoff' ? 1 : step === 'live' ? 3 : 2);

/** Onboarding timeline, step 1 to 3: done, current, upcoming. */
export function Steps({ step }: { step: OnboardingStep }) {
  const { t } = useI18n();
  const at = stepIndex(step);
  return (
    <aside className="card col" style={{ padding: '1.5rem', gap: 0 }} aria-labelledby="ob-steps">
      <h2 className="h3" id="ob-steps" style={{ marginBottom: '1rem' }}>{t('ob.first11')}</h2>
      <ol className="col" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {STEPS.map((s, i) => {
          const done = i < at;
          const now = i === at;
          return (
            <li key={s.id} className="row g12" style={{ position: 'relative', alignItems: 'flex-start', paddingBottom: '1.125rem' }} aria-current={now ? 'step' : undefined}>
              {i < STEPS.length - 1 && <span style={{ position: 'absolute', left: '0.75rem', top: '1.875rem', bottom: '-0.375rem', width: 2, background: '#E3E7F0' }} />}
              <span style={{
                width: '1.625rem', height: '1.625rem', borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                ...(done ? { background: '#0E7A4E' } : now ? { background: '#2F4DE0', boxShadow: '0 0 0 5px rgba(47,77,224,.18)' } : { border: '2px solid #C9D0DE', background: '#fff' }),
              }}>{done && <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>}</span>
              <div className="col" style={{ gap: 2 }}>
                <span className="t-xs t-mute w7">{t('ctr.stepOf', { n: i + 1 })}</span>
                <span className="w7" style={now ? { color: '#2F4DE0' } : undefined}>{t(s.title)}</span>
                <span className="t-xs t-mute">{t(s.sub)}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="row g8" style={{ background: '#E9F7EF', borderRadius: '0.75rem', padding: '0.625rem 0.75rem', marginTop: '0.25rem' }}>
        <span className="t-xs" style={{ color: '#0E5A3A', fontWeight: 700 }}>{t('ob.byWhatsapp')}</span>
      </div>
    </aside>
  );
}
