import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import type { BrainId } from '../requests/taxonomy';

const BRAINS: BrainId[] = ['researcher', 'marketer', 'creator', 'builder'];

/** The working team: NicoMarca leads and signs; his four Brains work with him, each in its craft. */
export function TeamLineup() {
  const { t } = useI18n();
  return (
    <section className="card col g20" aria-labelledby="h-lineup">
      <div className="col g4">
        <h2 className="h3" id="h-lineup">{t('team.lineup')}</h2>
        <p className="t-sm t-mute">{t('team.lineupSub')}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
        <div className="row g16" style={{ background: 'var(--ink)', color: '#fff', borderRadius: 20, padding: '18px 20px' }}>
          <img src="/brand/proposal/nicolas-face.jpg" alt="" className="h-16 w-16 flex-none rounded-full object-cover" style={{ border: '2px solid rgba(255,255,255,.3)' }} />
          <div className="col g4 min-w-0">
            <span className="t-xs" style={{ color: '#C9D0DE', fontWeight: 600 }}>{t('team.lead')}</span>
            <span className="h3" style={{ color: '#fff' }}>{t('team.nico')}</span>
            <span className="t-xs" style={{ color: '#C9D0DE' }}>{t('team.nicoRole')}</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {BRAINS.map((b) => (
            <div key={b} className="row g12" style={{ borderRadius: 16, padding: '12px 14px', background: `var(--${b}-bg, #F4F6FB)` }}>
              <span className={`brain b-${b} brain-idle`}><img src={`/brand/brains/${b}.png`} alt="" /></span>
              <div className="col min-w-0">
                <span className="w7">{brainName(b)} <span className="t-xs" style={{ color: `var(--${b}-ink)`, fontWeight: 600 }}>· {t(`st.role.${b}`)}</span></span>
                <span className="t-xs t-mute">{t(`team.spec.${b}`)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
