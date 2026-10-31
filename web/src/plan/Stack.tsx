import { useI18n } from '../i18n/I18nProvider';
import { money } from '../billing/useBilling';
import type { StackItem, ToolCategory } from './types';

const COLOR: Record<ToolCategory, string> = {
  web: '#2A7FFF', email: '#8B5CF6', ai: '#06B6D4', automation: '#2F4DE0', social: '#E0428A',
  analytics: '#F5B301', hosting: '#10B981', design: '#F97316', other: '#64748B',
};
const SOON = 30 * 864e5;

/** Block 4 · The third-party apps the brand runs on: what each one does, plan, cost, who pays it and when it renews. */
export function Stack({ items }: { items: StackItem[] }) {
  const { t, lang } = useI18n();
  if (!items.length) return null;
  const date = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  // Monthly equivalent of what is active and recurring, per currency.
  const monthly = items.filter((x) => x.status === 'active' && x.cost && (x.period === 'month' || x.period === 'year'))
    .reduce<Record<string, number>>((a, x) => ({ ...a, [x.currency]: (a[x.currency] ?? 0) + (x.period === 'year' ? x.cost! / 12 : x.cost!) }), {});
  const order = [...items].sort((a, b) => Number(a.status !== 'active') - Number(b.status !== 'active'));
  return (
    <section className="col g16" aria-labelledby="plan-stack">
      <div className="row g16" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="col g4">
          <p className="label">{t('plan.b4')}</p>
          <h2 id="plan-stack" className="h2">{t('plan.stackTitle')}</h2>
          <p className="t-sm t-mute" style={{ margin: 0, maxWidth: 640 }}>{t('plan.stackSub')}</p>
        </div>
        {Object.keys(monthly).length > 0 && (
          <div className="col" style={{ textAlign: 'right' }}>
            <span className="label">{t('plan.stackMonthly')}</span>
            <span className="w9" style={{ fontSize: 24, lineHeight: '30px' }}>{Object.entries(monthly).map(([cur, v]) => money(Math.round(v), cur, lang)).join(' + ')}</span>
          </div>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {order.map((x, i) => {
          const soon = !!x.renews && x.status === 'active' && new Date(`${x.renews}T12:00:00`).getTime() - Date.now() < SOON;
          return (
            <article key={i} className="card card-tight col g8" style={{ opacity: x.status === 'active' ? 1 : 0.6 }}>
              <div className="row g12" style={{ alignItems: 'center' }}>
                <span aria-hidden style={{ width: 40, height: 40, borderRadius: 12, background: COLOR[x.category] ?? COLOR.other, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 18, flex: 'none' }}>{x.name.slice(0, 1).toUpperCase()}</span>
                <div className="col" style={{ minWidth: 0, flex: 1 }}>
                  {x.url ? <a href={x.url} target="_blank" rel="noreferrer" className="w9" style={{ color: 'var(--ink)' }}>{x.name}</a> : <span className="w9">{x.name}</span>}
                  <span className="t-sm t-mute">{t(`plan.cat.${x.category}`)}{x.plan ? ` · ${x.plan}` : ''}</span>
                </div>
              </div>
              {x.purpose && <p className="t-sm" style={{ margin: 0 }}>{x.purpose}</p>}
              <div className="row g8" style={{ flexWrap: 'wrap', alignItems: 'center', marginTop: 'auto' }}>
                {x.cost != null && <span className="w7">{money(x.cost, x.currency, lang)} <span className="t-sm t-mute">{t(`plan.per.${x.period}`)}</span></span>}
                {x.cost == null && x.period === 'usage' && <span className="t-sm t-mute">{t('plan.per.usage')}</span>}
                <span className="chip" style={x.payer === 'client' ? { background: '#FFFBF0', borderColor: '#F5D98A' } : undefined}>{t(`plan.payer.${x.payer}`)}</span>
                {x.status !== 'active' && <span className="chip">{t(`plan.tool.${x.status}`)}</span>}
              </div>
              {x.renews && <span className="t-sm" style={{ color: soon ? '#B54708' : 'var(--mute, #5B6475)' }}>{t('plan.renews', { date: date(x.renews) })}</span>}
              {x.note && <span className="t-sm t-mute">{x.note}</span>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
