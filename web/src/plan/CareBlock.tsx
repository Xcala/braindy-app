import { useI18n } from '../i18n/I18nProvider';
import { money } from '../billing/useBilling';
import type { BrandPlan } from './types';

const ACCENTS = ['#8B5CF6', '#2A7FFF', '#E0428A', '#F5B301', '#06B6D4', '#10B981'];
const HOSTING_NAME = { esencial: 'Esencial', pro: 'Pro', ultra: 'Ultra' } as const;

/** Block 3 · The website's hosting and the maintenance that follows the project: what enters every month, the numbers, the fee. */
export function CareBlock({ c }: { c: BrandPlan }) {
  const { t, lang } = useI18n();
  const care = c.care;
  if (!care) return null;
  return (
    <section className="col g16" aria-labelledby="plan-care">
      <div className="col g4"><p className="label">{t('plan.b3')}</p><h2 id="plan-care" className="h2">{care.name}</h2></div>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="card card-tight col g16">
          {care.includes.length > 0 && (
            <>
              <span className="label">{t('plan.everyMonth')}</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {care.includes.map((x, i) => (
                  <div key={i} className="col g4" style={{ borderLeft: `3px solid ${ACCENTS[i % ACCENTS.length]}`, background: 'var(--niebla)', borderRadius: 12, padding: '12px 14px' }}>
                    <span className="label" style={{ color: 'var(--ink)' }}>{x.title}</span>
                    {x.body && <span className="t-sm">{x.body}</span>}
                  </div>
                ))}
              </div>
            </>
          )}
          {care.metrics.length > 0 && (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              {care.metrics.map((m, i) => (
                <div key={i} className="col" style={{ border: '1px solid var(--line)', borderRadius: 16, padding: '12px 14px' }}>
                  <span className="w9" style={{ fontSize: 32, lineHeight: '38px', color: ACCENTS[(i + 1) % ACCENTS.length] }}>{m.value}</span>
                  <span className="t-sm t-mute">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card card-tight col g12" style={{ background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' }}>
          <span className="label" style={{ color: '#8FA0FF' }}>{care.period === 'year' ? t('plan.careYear') : t('plan.careMonth')}</span>
          {care.price != null && (
            <span className="col">
              <span className="w9" style={{ fontSize: 40, lineHeight: '44px', letterSpacing: '-.03em' }}>{money(care.price, c.currency, lang)}</span>
              <span className="t-sm" style={{ color: '#C9D0DE' }}>{care.period === 'year' ? t('plan.perYear') : t('plan.perMonth')}{care.note ? ` · ${care.note}` : ''}</span>
            </span>
          )}
          {care.hosting && <span className="t-sm"><span className="w7">{t('plan.hosting')}:</span> {t('plan.hostingPlan').replace('{plan}', HOSTING_NAME[care.hosting])}</span>}
          {care.excludes.length > 0 && <ul className="col g4 t-sm" style={{ margin: 0, paddingLeft: 18, color: '#C9D0DE' }}>{care.excludes.map((x, i) => <li key={i}>{t('plan.excl')} {x}</li>)}</ul>}
          {care.startsAfter && <p className="t-sm" style={{ margin: 0, color: '#C9D0DE', borderTop: '1px solid rgba(255,255,255,.15)', paddingTop: 12 }}>{care.startsAfter}</p>}
          {care.siteUrl && <a className="btn btn-white btn-sm" style={{ alignSelf: 'flex-start' }} href={care.siteUrl} target="_blank" rel="noreferrer">{t('plan.openSite')}</a>}
        </div>
      </div>
    </section>
  );
}
