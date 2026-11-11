import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { sourceName, type SalesStats } from './useAdStats';

type Card = { k: string; v: string; sub: string };

/** Results › Sales: one sales portal (DoorDash…) by month — the store, then what promotions and ads brought and cost, then each promotion. */
export function SalesBody({ stats }: { stats: SalesStats }) {
  const { t, lang } = useI18n();
  const locale = lang === 'es' ? 'es-CO' : 'en-US';
  const [month, setMonth] = useState(stats.months.at(-1)!.month);
  const m = stats.months.find((x) => x.month === month) ?? stats.months.at(-1)!;
  const src = sourceName(stats.source);
  const money = (v?: number | null) => v == null ? '—' : new Intl.NumberFormat(locale, { style: 'currency', currency: stats.currency, maximumFractionDigits: v < 100 ? 2 : 0 }).format(v);
  const int = (v?: number | null) => v == null ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v);
  const pct = (a?: number | null, b?: number | null) => a == null || !b ? null : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(a / b);
  const monthName = (s: string) => new Date(`${s}-15`).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const store: Card[] = [
    { k: 'sales', v: money(m.sales), sub: m.period ?? '' },
    { k: 'orders', v: int(m.orders), sub: '' },
    { k: 'aov', v: m.sales != null && m.orders ? money(m.sales / m.orders) : '—', sub: '' },
    { k: 'newCustomers', v: int(m.newCustomers), sub: pct(m.newCustomers, m.customers) ? t('sales.h.newCustomers', { pct: pct(m.newCustomers, m.customers)! }) : '' },
  ].filter((c) => c.v !== '—');
  const ads: Card[] = [
    { k: 'adSales', v: money(m.adSales), sub: pct(m.adSales, m.sales) ? t('sales.h.adSales', { pct: pct(m.adSales, m.sales)! }) : '' },
    { k: 'adOrders', v: int(m.adOrders), sub: '' },
    { k: 'adSpend', v: money(m.adSpend), sub: m.credits ? t('sales.h.adSpend', { src }) : '' },
    { k: 'roas', v: m.adSales != null && m.adSpend ? `${(m.adSales / m.adSpend).toFixed(1)}×` : '—', sub: t('sales.h.roas') },
  ].filter((c) => c.v !== '—');
  const cards = (list: Card[]) => (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {list.map((c) => (
        <div key={c.k} className="card col g4">
          <span className="t-sm t-mute w7">{t(`sales.k.${c.k}` as StringKey)}</span>
          <span className="h1">{c.v}</span>
          {c.sub && <span className="t-xs t-mute">{c.sub}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {stats.months.length > 1 && (
        <select className="input print:hidden" style={{ width: 'auto', alignSelf: 'flex-start' }} value={m.month} onChange={(e) => setMonth(e.target.value)} aria-label={t('sales.month')}>
          {stats.months.map((x) => <option key={x.month} value={x.month}>{monthName(x.month)}</option>)}
        </select>
      )}
      {cards(store)}
      {ads.length > 0 && <h2 className="h3">{t('sales.ads')}</h2>}
      {ads.length > 0 && cards(ads)}
      {(m.promos?.length ?? 0) > 0 && (
        <section className="card col g8">
          <h2 className="h3">{t('sales.promos')}</h2>
          <ul className="col">
            {m.promos!.map((p) => (
              <li key={p.name} className="row between g12 wrap" style={{ padding: '12px 0', borderTop: '1px solid var(--line)' }}>
                <div className="col g4" style={{ minWidth: 0, flex: '1 1 220px' }}><span className="w7">{p.name}</span>{p.dates && <span className="t-xs t-mute">{p.dates}</span>}</div>
                <div className="row g16 wrap t-sm">
                  {p.sales != null && <b>{money(p.sales)}</b>}
                  {p.orders != null && <span className="t-mute">{t('sales.p.orders', { n: int(p.orders) })}</span>}
                  {p.cost != null && <span className="t-mute">{t('sales.p.cost', { v: money(p.cost) })}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {m.note && <p className="t-sm t-mute">{m.note}</p>}
    </>
  );
}
