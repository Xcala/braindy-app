import { useI18n } from '../i18n/I18nProvider';
import type { SalesMonth } from './useAdStats';

type Fmt = { money: (v?: number | null) => string; int: (v?: number | null) => string; x: (a?: number | null, b?: number | null) => string };

/** Results › Sales, below the cards: each promotion as a table (gross, credit, net, return), how costs add up, conclusions. */
export function SalesDetail({ m, src, fmt }: { m: SalesMonth; src: string; fmt: Fmt }) {
  const { t } = useI18n();
  const promos = m.promos ?? [];
  const hasGross = promos.some((p) => p.grossCost != null);
  const hasCredit = promos.some((p) => p.credit != null);
  const th = { textAlign: 'right' as const, padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' as const };
  const td = { ...th, borderTop: '1px solid var(--line)' };
  return (
    <>
      {promos.length > 0 && (
        <section className="card col g8">
          <h2 className="h3">{t('sales.promos')}</h2>
          <div style={{ overflowX: 'auto', margin: '0 -0.75rem' }}>
            <table className="t-sm" style={{ borderCollapse: 'collapse', width: '100%', minWidth: 560 }}>
              <thead className="t-xs t-mute">
                <tr>
                  <th style={{ ...th, textAlign: 'left' }}>{t('sales.c.name')}</th>
                  <th style={th}>{t('sales.c.orders')}</th>
                  <th style={th}>{t('sales.c.sales')}</th>
                  {hasGross && <th style={th}>{t('sales.c.gross')}</th>}
                  {hasCredit && <th style={th}>{t('sales.c.credit', { src })}</th>}
                  <th style={th}>{t('sales.c.net')}</th>
                  {hasGross && <th style={th}>{t('sales.c.roas')}</th>}
                  <th style={th}>{t('sales.c.roasNet')}</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.name}>
                    <td style={{ ...td, textAlign: 'left', whiteSpace: 'normal' }}><span className="w7">{p.name}</span>{p.dates && <span className="t-xs t-mute" style={{ display: 'block' }}>{p.dates}</span>}</td>
                    <td style={td}>{fmt.int(p.orders)}</td>
                    <td style={td}><b>{fmt.money(p.sales)}</b></td>
                    {hasGross && <td style={td}>{fmt.money(p.grossCost)}</td>}
                    {hasCredit && <td style={td}>{p.credit ? `−${fmt.money(p.credit)}` : '—'}</td>}
                    <td style={td}>{fmt.money(p.cost)}</td>
                    {hasGross && <td style={td}>{fmt.x(p.sales, p.grossCost)}</td>}
                    <td style={td}><b>{fmt.x(p.sales, p.cost)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {(m.costNotes?.length ?? 0) > 0 && (
        <section className="card col g8">
          <h2 className="h3">{t('sales.costs')}</h2>
          <ul className="col g8 t-sm" style={{ margin: 0, paddingLeft: '1.1rem' }}>{m.costNotes!.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      )}
      {(m.insights?.length ?? 0) > 0 && (
        <section className="card col g8">
          <h2 className="h3">{t('sales.insights')}</h2>
          <ul className="col g8 t-sm" style={{ margin: 0, paddingLeft: '1.1rem' }}>{m.insights!.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      )}
    </>
  );
}
