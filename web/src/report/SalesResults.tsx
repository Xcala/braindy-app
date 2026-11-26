import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { sourceName, type SalesStats } from './useAdStats';
import { SalesDetail } from './SalesDetail';

type Card = { k: string; v: string; sub: string; d?: string | null };

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
  const i = stats.months.indexOf(m);
  const prev = i > 0 ? stats.months[i - 1] : undefined;
  // Change vs the month before, only when both months have the number.
  const delta = (a?: number | null, b?: number | null) => a == null || !b ? null : `${a >= b ? '+' : ''}${new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format((a - b) / b)}`;
  const x = (a?: number | null, b?: number | null) => a == null || !b ? '—' : `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(a / b)}×`;
  const monthName = (s: string) => new Date(`${s}-15`).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const store: Card[] = [
    { k: 'sales', v: money(m.sales), sub: m.period ?? '', d: delta(m.sales, prev?.sales) },
    { k: 'orders', v: int(m.orders), sub: '', d: delta(m.orders, prev?.orders) },
    { k: 'aov', v: m.sales != null && m.orders ? money(m.sales / m.orders) : '—', sub: '', d: delta(m.sales != null && m.orders ? m.sales / m.orders : null, prev?.sales != null && prev.orders ? prev.sales / prev.orders : null) },
    { k: 'newCustomers', v: int(m.newCustomers), sub: pct(m.newCustomers, m.customers) ? t('sales.h.newCustomers', { pct: pct(m.newCustomers, m.customers)! }) : '', d: delta(m.newCustomers, prev?.newCustomers) },
  ].filter((c) => c.v !== '—');
  const ads: Card[] = [
    { k: 'adSales', v: money(m.adSales), sub: pct(m.adSales, m.sales) ? t('sales.h.adSales', { pct: pct(m.adSales, m.sales)! }) : '', d: delta(m.adSales, prev?.adSales) },
    { k: 'adOrders', v: int(m.adOrders), sub: '' },
    { k: 'adSpend', v: money(m.adSpend), sub: m.credits ? t('sales.h.adSpend', { src }) : '' },
    { k: 'roas', v: m.adSales != null && m.adSpend ? `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(m.adSales / m.adSpend)}×` : '—', sub: t('sales.h.roas') },
  ].filter((c) => c.v !== '—');
  const cards = (list: Card[]) => (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {list.map((c) => (
        <div key={c.k} className="card col g4">
          <span className="t-sm t-mute w7">{t(`sales.k.${c.k}` as StringKey)}</span>
          <span className="h1">{c.v}</span>
          {c.sub && <span className="t-xs t-mute">{c.sub}</span>}
          {c.d && prev && <span className="t-xs w7">{t('sales.vsPrev', { d: c.d, m: new Date(`${prev.month}-15`).toLocaleDateString(locale, { month: 'short' }) })}</span>}
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
      <SalesDetail m={m} src={src} fmt={{ money, int, x }} />
      {m.note && <p className="t-sm t-mute">{m.note}</p>}
      {m.readAt && <p className="t-xs t-mute">{t('sales.readAt', { src, d: m.readAt })}</p>}
    </>
  );
}
