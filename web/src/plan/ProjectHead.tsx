import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { cuentasApi, money, monthName, type ClientProject, type Cuenta } from '../cuentas/api';

export type LiveProject = { project: ClientProject; paidCount: number; next: { number: string; month: string; amount: number } | null };

/** The project the brand is being charged for in cuentas de cobro (what billing people see), for Mi plan when no plan is
 *  loaded: «se está preparando» was wrong for a client already paying installments (audit C1, 2026-11-26). Null when there
 *  is none or the person cannot see Payments. */
export function useLiveProject(brandId: string | undefined): LiveProject | null {
  const [live, setLive] = useState<LiveProject | null>(null);
  useEffect(() => {
    setLive(null);
    if (!brandId) return;
    let on = true;
    cuentasApi.list(brandId).then((r) => {
      const project = (r.projects ?? []).find((p) => p.totalAmount > 0);
      if (!on || !project) return;
      const mine = r.docs.filter((d: Cuenta) => d.agreementId === project.id && d.type === 'cuenta_cobro');
      const open = mine.filter((d) => ['issued', 'sent', 'overdue'].includes(d.status)).sort((a, b) => a.billingMonth.localeCompare(b.billingMonth))[0];
      const next = open ? { number: open.number, month: open.billingMonth, amount: open.amount - open.paid }
        : project.next ? { number: project.next.number, month: project.next.date.slice(0, 7), amount: project.next.amount } : null;
      setLive({ project, paidCount: mine.filter((d) => d.status === 'paid').length, next });
    }).catch(() => undefined);
    return () => { on = false; };
  }, [brandId]);
  return live;
}

/** Mi plan's header built from that project: name, how much is paid and the next installment, with the way to Payments. */
export function ProjectHead({ live, brandName, action }: { live: LiveProject; brandName: string; action?: ReactNode }) {
  const { t, lang } = useI18n();
  const { project: p, paidCount, next } = live;
  const pct = p.totalAmount ? Math.min(100, Math.round((p.paid / p.totalAmount) * 100)) : 0;
  const soft = { color: '#C9D0DE', margin: 0 } as const;
  return (
    <header className="card col g12" style={{ background: 'linear-gradient(135deg,#0B1220 0%,#16224A 60%,#2F4DE0 140%)', color: '#fff', borderColor: '#0B1220' }}>
      <div className="row between g12" style={{ alignItems: 'center' }}>
        <p className="label" style={{ color: '#8FA0FF', margin: 0 }}>{brandName} · {t('ct.p.live')}</p>
        {action}
      </div>
      <h1 className="h1" style={{ color: '#fff' }}><span className="w9">{p.title}</span></h1>
      <div className="col g4" style={{ maxWidth: '30rem' }}>
        <div className="row between g8 t-sm" style={soft}>
          <span>{t('ct.p.paid', { p: String(pct) })}</span>
          <span>{t('ct.p.of', { paid: money(p.paid, p.currency), total: money(p.totalAmount, p.currency) })}</span>
        </div>
        <span role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('ct.p.paid', { p: String(pct) })} style={{ height: '0.5rem', borderRadius: '6.1875rem', background: 'rgba(255,255,255,.18)', overflow: 'hidden' }}>
          <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#10B981,#06B6D4)' }} />
        </span>
      </div>
      <div className="row between g12 wrap" style={{ alignItems: 'center' }}>
        <p className="t-sm" style={soft}>
          {next ? <>{t('ct.p.next')} <b style={{ color: '#fff' }}>{next.number} · {monthName(next.month, lang)}</b> · {money(next.amount, p.currency)}</> : t('ct.p.done')}
          {' · '}{t('ct.p.paymentsSub', { n: String(paidCount), of: String(p.installments) })}
        </p>
        <Link to="/plan?tab=payments" className="btn btn-white btn-sm">{t('ct.p.payments')} ›</Link>
      </div>
    </header>
  );
}
