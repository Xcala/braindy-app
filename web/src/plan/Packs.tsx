import { useI18n } from '../i18n/I18nProvider';
import { money } from '../billing/useBilling';
import type { BrandPlan, PackStatus } from './types';

const STATUS_STYLE: Record<PackStatus, { color: string; background: string }> = {
  pending: { color: '#5C6375', background: '#F4F6FB' },
  in_progress: { color: '#2F4DE0', background: '#EAF0FF' },
  delivered: { color: '#0E8A5F', background: '#E6F7F0' },
};
const CHECK = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10B981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none', marginTop: 3 }}><path d="m5 12 5 5 9-10" /></svg>;
const CROSS = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#9AA1B2" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" style={{ flex: 'none', marginTop: 3 }}><path d="M7 7l10 10M17 7 7 17" /></svg>;

/** Block 1 · The plans or packs the client bought, with what each includes, plus total, payment terms and exclusions. */
export function Packs({ c, onStatus }: { c: BrandPlan; onStatus?: (i: number, s: PackStatus) => void }) {
  const { t, lang } = useI18n();
  if (!c.packs.length) return null;
  const cols = c.packs.length === 1 ? '' : c.packs.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3';
  return (
    <section className="col g16" aria-labelledby="plan-packs">
      <div className="col g4"><p className="label">{t('plan.b1')}</p><h2 id="plan-packs" className="h2">{t('plan.packsTitle')}</h2></div>
      <div className={`grid gap-4 ${cols}`}>
        {c.packs.map((p, i) => (
          <article key={i} className="card card-tight col g16" style={{ borderTop: '4px solid var(--azul)' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div className="col g4">
                {p.label && <span className="label" style={{ color: 'var(--azul)' }}>{p.label}</span>}
                <h3 className="w9" style={{ fontSize: 22, lineHeight: '28px', margin: 0 }}>{p.name}</h3>
                {p.subtitle && <span className="t-sm t-mute">{p.subtitle}</span>}
              </div>
              {onStatus ? (
                <select aria-label={t('plan.packStatus')} value={p.status} onChange={(e) => onStatus(i, e.target.value as PackStatus)} className="t-sm w7" style={{ ...STATUS_STYLE[p.status], border: 0, borderRadius: 999, padding: '4px 10px' }}>
                  {(['pending', 'in_progress', 'delivered'] as const).map((s) => <option key={s} value={s}>{t(`plan.st.${s}`)}</option>)}
                </select>
              ) : <span className="chip chip-plain" style={STATUS_STYLE[p.status]}>{t(`plan.st.${p.status}`)}</span>}
            </div>
            {p.price != null && (
              <div className="col">
                <span className="w9" style={{ fontSize: 30, lineHeight: '34px', letterSpacing: '-.03em' }}>{money(p.price, c.currency, lang)}</span>
                <span className="t-sm t-mute">{p.period === 'month' ? `${t('plan.perMonth')}${p.months ? ` · ${t('plan.months').replace('{n}', String(p.months))}` : ''}` : t('plan.once')}</span>
              </div>
            )}
            <ul className="col g8" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {p.includes.map((x, j) => <li key={j} className="row g8 t-sm" style={{ alignItems: 'flex-start' }}>{CHECK}<span>{x}</span></li>)}
              {p.excludes.map((x, j) => <li key={`x${j}`} className="row g8 t-sm t-mute" style={{ alignItems: 'flex-start' }}>{CROSS}<span>{x}</span></li>)}
            </ul>
          </article>
        ))}
      </div>
      {(c.total || c.payment.length > 0 || c.notIncluded.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card card-tight col g12">
            {c.total && (
              <div className="col g4">
                <span className="label">{c.total.label || t('plan.total')}</span>
                <span className="w9" style={{ fontSize: 34, lineHeight: '38px', color: '#0E8A5F', letterSpacing: '-.03em' }}>{money(c.total.amount, c.currency, lang)}</span>
              </div>
            )}
            {c.payment.length > 0 && <ul className="col g4 t-sm" style={{ margin: 0, paddingLeft: 18 }}>{c.payment.map((x, i) => <li key={i}>{x}</li>)}</ul>}
          </div>
          {c.notIncluded.length > 0 && (
            <div className="card card-tight col g8">
              <span className="label">{t('plan.notIncluded')}</span>
              <ul className="col g4 t-sm" style={{ margin: 0, paddingLeft: 18 }}>{c.notIncluded.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
