import { useI18n } from '../i18n/I18nProvider';
import { money, type Invoice } from '../billing/useBilling';

/** The brand's invoices (design and hosting), newest first, with their PDF. */
export function Invoices({ invoices }: { invoices: Invoice[] }) {
  const { t, lang } = useI18n();
  return (
    <section className="card col g8" aria-labelledby="inv-h">
      <h2 className="h3" id="inv-h">{t('bill.invoices')}</h2>
      {invoices.length === 0 && <p className="t-sm t-mute">{t('bill.noInvoices')}</p>}
      {invoices.map((i) => (
        <div key={i.id} className="row between g12 wrap t-sm" style={{ padding: '0.5rem 0', borderTop: '1px solid var(--line)' }}>
          <span style={{ minWidth: '6.875rem' }}>{i.date?.toDate().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span className="grow truncate">{i.concept}</span>
          <span className="w7">{money(i.amount, i.currency, lang)}</span>
          <span className={`chip ${i.status === 'paid' ? 'c-approved' : 'c-lost'}`}>{t(`bill.inv.${i.status}`)}</span>
          {(i.pdfUrl || i.hostedUrl) ? <a href={(i.pdfUrl ?? i.hostedUrl)!} target="_blank" rel="noreferrer" className="w7">PDF</a> : <span className="t-mute">—</span>}
        </div>
      ))}
    </section>
  );
}
