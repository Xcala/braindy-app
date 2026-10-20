import { useI18n } from '../i18n/I18nProvider';
import type { OnboardingStep } from '../brands/BrandProvider';
import type { StringKey } from '../i18n/strings';

const STEPS: Array<{ id: OnboardingStep | 'access'; day: StringKey; title: StringKey; sub: StringKey }> = [
  { id: 'access', day: 'ob.day0', title: 'ob.s.access', sub: 'ob.s.accessSub' },
  { id: 'brief', day: 'ob.day01', title: 'ob.s.brief', sub: 'ob.s.briefSub' },
  { id: 'brain', day: 'ob.day1', title: 'ob.s.brain', sub: 'ob.s.brainSub' },
  { id: 'session', day: 'ob.day2', title: 'ob.s.session', sub: 'ob.s.sessionSub' },
  { id: 'firstDelivery', day: 'ob.day35', title: 'ob.s.first', sub: 'ob.s.firstSub' },
  { id: 'live', day: 'ob.day11', title: 'ob.s.live', sub: 'ob.s.liveSub' },
];

/** "Your first 11 days" timeline (design 17): done, current, upcoming. */
export function Steps({ step }: { step: OnboardingStep }) {
  const { t } = useI18n();
  const at = STEPS.findIndex((s) => s.id === step);
  return (
    <aside className="card col" style={{ padding: 24, gap: 0 }} aria-labelledby="ob-steps">
      <h2 className="h3" id="ob-steps" style={{ marginBottom: 16 }}>{t('ob.first11')}</h2>
      <ol className="col" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {STEPS.map((s, i) => {
          const done = i < at || step === 'live';
          const now = i === at && step !== 'live';
          return (
            <li key={s.id} className="row g12" style={{ position: 'relative', alignItems: 'flex-start', paddingBottom: 18 }} aria-current={now ? 'step' : undefined}>
              {i < STEPS.length - 1 && <span style={{ position: 'absolute', left: 12, top: 30, bottom: -6, width: 2, background: '#E3E7F0' }} />}
              <span style={{
                width: 26, height: 26, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                ...(done ? { background: '#0E7A4E' } : now ? { background: '#2F4DE0', boxShadow: '0 0 0 5px rgba(47,77,224,.18)' } : { border: '2px solid #C9D0DE', background: '#fff' }),
              }}>{done && <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>}</span>
              <div className="col" style={{ gap: 2 }}>
                <span className="t-xs t-mute w7">{t(s.day)}</span>
                <span className="w7" style={now ? { color: '#2F4DE0' } : undefined}>{t(s.title)}</span>
                <span className="t-xs t-mute">{t(s.sub)}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="row g8" style={{ background: '#E9F7EF', borderRadius: 12, padding: '10px 12px', marginTop: 4 }}>
        <span className="t-xs" style={{ color: '#0E5A3A', fontWeight: 700 }}>{t('ob.byWhatsapp')}</span>
      </div>
    </aside>
  );
}
