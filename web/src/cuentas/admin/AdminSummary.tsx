import { useI18n } from '../../i18n/I18nProvider';
import { money, type Agreement, type ClientProject, type Cuenta, type Currency } from '../api';
import { paidOf } from './PayProgress';
import { workOf } from './ProjectBars';

const OPEN = ['issued', 'sent', 'overdue'];
const sumBy = (rows: Array<[Currency, number]>) => {
  const m = new Map<Currency, number>();
  for (const [c, v] of rows) m.set(c, (m.get(c) ?? 0) + v);
  return [...m].filter(([, v]) => v > 0).map(([c, v]) => money(v, c)).join(' + ');
};

/** The three numbers NickMark looks at first: what he is owed, what is paid and how far the work is. */
export function AdminSummary({ agreements, docs }: { agreements: Agreement[]; docs: Cuenta[] }) {
  const { t } = useI18n();
  const live = agreements.filter((a) => a.status !== 'draft');
  if (!live.length) return null;
  const open = docs.filter((d) => d.type === 'cuenta_cobro' && OPEN.includes(d.status));
  const owed = sumBy(open.map((d) => [d.currency ?? 'COP', d.amount - d.paid]));
  const paid = sumBy(live.map((a) => [a.currency ?? 'COP', paidOf(a, docs)]));
  const total = live.reduce((s, a) => s + a.totalAmount, 0);
  const paidPct = total ? Math.round((live.reduce((s, a) => s + paidOf(a, docs), 0) / total) * 100) : 0;
  const works = live.map(workOf).filter((w): w is NonNullable<ReturnType<typeof workOf>> => !!w);
  const workPct = works.length ? Math.round((works.reduce((s, w) => s + w.done, 0) / works.reduce((s, w) => s + w.worth, 0)) * 100) : null;
  const gap = workPct === null ? 0 : workPct - paidPct;
  return (
    <div className="cc-nums">
      <div><span className="label">{t('pg.a.owed')}</span><span className="cc-big">{owed || money(0)}</span><span className="t-xs t-mute">{open.length === 1 ? t('pg.a.open1') : t('pg.a.openN', { n: String(open.length) })}</span></div>
      <div><span className="label">{t('pg.a.paid')}</span><span className="cc-big">{paid || money(0)}</span><span className="t-xs t-mute">{t(live.length > 1 ? 'pg.a.paidPctN' : 'pg.a.paidPct', { p: String(paidPct) })}</span></div>
      <div><span className="label">{t('pg.a.work')}</span><span className="cc-big">{workPct === null ? '—' : `${workPct} %`}</span><span className="t-xs t-mute">{workPct === null ? t('pg.a.noStages') : t(gap > 10 ? 'pg.a.ahead' : gap < -10 ? 'pg.a.behind' : 'pg.a.even')}</span></div>
    </div>
  );
}

/** «Ver como cliente»: what billing people see, built from NickMark's data the way the server builds it for them. */
export function clientView(agreements: Agreement[], docs: Cuenta[]): { docs: Cuenta[]; projects: ClientProject[] } {
  const shown = docs.filter((d) => d.status !== 'scheduled' && !d.held).sort((x, y) => x.billingMonth.localeCompare(y.billingMonth));
  const projects = agreements.filter((a) => a.status !== 'draft' && a.totalAmount > 0).map((a) => {
    const next = docs.filter((d) => d.agreementId === a.id && d.type === 'cuenta_cobro' && d.status === 'scheduled').sort((x, y) => x.scheduledDate.localeCompare(y.scheduledDate))[0];
    return { id: a.id, title: a.title, totalAmount: a.totalAmount, currency: a.currency ?? 'COP', installments: a.installments, paid: paidOf(a, docs), next: next ? { number: next.number, date: next.scheduledDate, amount: next.amount } : null };
  });
  return { docs: shown, projects };
}
