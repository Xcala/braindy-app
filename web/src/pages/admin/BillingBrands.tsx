import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { money } from '../../billing/useBilling';
import { useL } from '../../plan/HostingParts';
import { siteState, type HostRow } from './SiteHostingAdmin';

const CHIP: Record<string, string> = { active: 'c-active', past_due: 'c-lost', pending: 'c-approve', transfer_review: 'c-approve', canceled: 'c-archived' };
const ORDER: Record<string, number> = { past_due: 0, transfer_review: 1, pending: 2, active: 3, canceled: 4 };
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/** Admin › Billing · one list of brands with plan and hosting together (FA2). What fails goes first and in red; tapping a
 *  row opens its plan window, which carries the hosting too. Brands with no plan fold into one row. */
export function BillingBrands({ rows, onOpen }: { rows: HostRow[]; onOpen: (brandId: string) => void }) {
  const { brands } = useBrands();
  const { t, lang } = useI18n();
  const L = useL();
  const list = brands.filter((b) => b.status === 'active' && b.kind === 'brand');
  const rowOf = (id: string) => rows.find((r) => r.brandId === id);
  const withPlan = list.filter((b) => rowOf(b.id)).map((b) => {
    const r = rowOf(b.id)!;
    const site = siteState(r, L);
    const status = r.status ?? 'pending';
    return { b, r, site, status, bad: status === 'past_due' || !!site?.bad };
  }).sort((x, y) => Number(y.bad) - Number(x.bad) || (ORDER[x.status] ?? 9) - (ORDER[y.status] ?? 9) || x.b.name.localeCompare(y.b.name));
  const noPlan = list.filter((b) => !rowOf(b.id));
  const amount = (r: HostRow) => (r.monthly ? `${money(r.monthly, r.currency, lang)} / ${t('pay.month')}` : r.project ? money(r.project, r.currency, lang) : '—');

  return (
    <section className="col g12" aria-labelledby="bb-h">
      <h2 className="h3" id="bb-h">{t('bill.a.withPlan', { n: withPlan.length })}</h2>
      {withPlan.length > 0 && (
        <div className="table bb-table">
          <div className="trow head label bb-head">
            <span>{t('admin.brands.colBrand')}</span><span>{t('bill.a.path')}</span><span>{t('bill.a.amount')}</span><span>{t('bill.a.site')}</span><span>{t('bill.a.status')}</span>
          </div>
          {withPlan.map(({ b, r, site, status, bad }) => (
            <button key={b.id} type="button" className={`trow bb-row${bad ? ' is-bad' : ''}`} onClick={() => onOpen(b.id)} aria-label={t('bill.a.planFor', { name: b.name })}>
              <span className="bb-av" aria-hidden="true">{initials(b.name)}</span>
              <span className="bb-name w7 truncate">{b.name}</span>
              <span className={`bb-plan t-sm${!r.path && amount(r) === '—' ? ' bb-empty' : ''}`}>{r.path ? t(`bill.path.${r.path}`) : '—'}</span>
              <span className={`bb-amt t-sm${!r.path && amount(r) === '—' ? ' bb-empty' : ''}`}>{amount(r)}</span>
              <span className={`bb-site t-sm${site?.bad ? ' ba-bad' : ' t-mute'}`}>{site?.text ?? L(['Sin sitio', 'No site'])}</span>
              <span className="bb-st"><span className={`chip ${CHIP[status] ?? 'c-draft'}`}>{t(`bill.status.${status}` as 'bill.status.active')}</span></span>
            </button>
          ))}
        </div>
      )}

      {noPlan.length > 0 && (
        <details className="card bb-none">
          <summary className="row between g12" style={{ cursor: 'pointer', listStyle: 'none' }}>
            <span className="col g4" style={{ minWidth: 0 }}>
              <b>{noPlan.length === 1 ? t('bill.a.noPlan1') : t('bill.a.noPlanN', { n: noPlan.length })}</b>
              <span className="t-xs t-mute truncate">{noPlan.slice(0, 3).map((b) => b.name).join(', ')}{noPlan.length > 3 ? '…' : ''}</span>
            </span>
            <span aria-hidden className="fold-chev" style={{ fontSize: '1.25rem', lineHeight: 1 }}>⌄</span>
          </summary>
          <div className="col" style={{ marginTop: '0.5rem' }}>
            {noPlan.map((b) => (
              <div key={b.id} className="row between g12 bb-nrow">
                <span className="truncate">{b.name}</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpen(b.id)}>{t('bill.a.setPlan')}</button>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
