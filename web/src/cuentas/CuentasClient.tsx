import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { BillingFiles } from './BillingFiles';
import { PayDialog } from './PayDialog';
import { cuentasApi, dueOf, money, monthName, openUrl, shortDate, type ClientProject, type Cuenta } from './api';
import './cuentas.css';

const OPEN = ['issued', 'sent', 'overdue'];
const pct = (n: number, total: number) => (total > 0 ? Math.min(100, Math.round((n / total) * 100)) : 0);

/** What the client sees in Pagos when it is billed in cuentas de cobro: the project on top (paid, left), «Toca ahora»
 *  with the only blue button, the ones coming next in order with their day, and what is paid and the papers folded.
 *  `preview` is NickMark's «Ver como cliente»: the same view, nothing can be paid. */
export function CuentasClient({ brandId, docs, projects, feePct, reload, preview }: { brandId: string; docs: Cuenta[]; projects: ClientProject[]; feePct: number; reload: () => void; preview?: boolean }) {
  const { t, lang } = useI18n();
  const [paying, setPaying] = useState<Cuenta | null>(null);
  const [nDocs, setNDocs] = useState(0);
  const cuentas = docs.filter((d) => d.type === 'cuenta_cobro').sort((a, b) => a.billingMonth.localeCompare(b.billingMonth));
  const open = cuentas.filter((d) => OPEN.includes(d.status));
  const paid = cuentas.filter((d) => d.status === 'paid');
  const recibos = docs.filter((d) => d.type === 'recibo');
  const [now, ...rest] = open;
  const coming = projects.map((p) => p.next).filter((x): x is NonNullable<ClientProject['next']> => !!x);
  const pdf = (d: Cuenta) => !preview && openUrl(cuentasApi.pdf(brandId, d.id));
  const pay = (d: Cuenta) => !preview && setPaying(d);
  const review = (d: Cuenta) => d.payments.some((p) => p.status === 'pending');
  const when = (d: Cuenta) => d.status === 'overdue' ? t('pg.c.lateSince', { d: shortDate(dueOf(d), lang) }) : t('pg.c.due', { d: shortDate(dueOf(d), lang) });
  const pdfBtn = (d: Cuenta) => d.hasPdf && <button className="cc-link" onClick={() => pdf(d)}>{t('cc.pdf')}</button>;

  return (
    <div className="col g16">
      {projects.map((p) => {
        const mine = cuentas.filter((d) => d.agreementId === p.id);
        const v = pct(p.paid, p.totalAmount);
        return (
          <div key={p.id} className="card cc-proj">
            <span className="t-sm"><b>{p.title}</b> · {t('pg.c.installments', { n: String(p.installments) })}</span>
            <div className="cc-proj-nums">
              <span className="col g2"><span className="label">{t('pg.c.paid')}</span><span className="h3 w7">{money(p.paid, p.currency)}</span></span>
              <span className="col g2"><span className="label">{t('pg.c.left')}</span><span className="h3 w7">{money(Math.max(0, p.totalAmount - p.paid), p.currency)}</span></span>
            </div>
            <div className="cc-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={t('cc.pr.label', { p: String(v) })}><span className="is-paid" style={{ width: `${v}%` }} /></div>
            <span className="t-xs t-mute">{v} % · {t('pg.c.paidOf', { a: String(mine.filter((d) => d.status === 'paid').length), b: String(p.installments) })}</span>
          </div>
        );
      })}

      {now ? (
        <div className="col g8">
          <p className="label">{t('pg.c.now')}</p>
          <div className="cc-now">
            <span className="col g2" style={{ minWidth: 0 }}>
              <span className="t-sm"><b>{now.number}</b> · {monthName(now.billingMonth, lang)} · <b>{money(now.amount - now.paid, now.currency)}</b></span>
              <span className="t-xs t-mute">{review(now) ? t('cc.pending') : when(now)}{now.paid > 0 ? ` · ${t('cc.paidPart', { v: money(now.paid, now.currency) })}` : ''}</span>
              <span className="t-xs t-mute">{feePct > 0 ? t('pg.c.fee', { pct: String(feePct) }) : t('pg.c.feeNone')}</span>
            </span>
            <span className="row g12" style={{ alignItems: 'center' }}>
              {pdfBtn(now)}
              {!review(now) && <button className="btn btn-primary" disabled={preview} onClick={() => pay(now)}>{t('cc.pay.title', { n: now.number })}</button>}
            </span>
          </div>
        </div>
      ) : cuentas.length > 0 && <p className="card card-tight t-sm">{t('pg.c.upToDate')}</p>}

      {(rest.length > 0 || coming.length > 0) && (
        <div className="col g8">
          <p className="label">{t('pg.c.next')}</p>
          <div className="col">
            {rest.map((d) => (
              <div key={d.id} className="cc-next">
                <span className="col g2" style={{ minWidth: 0 }}><span className="t-sm"><b>{d.number}</b> · {monthName(d.billingMonth, lang)}</span><span className={`t-xs ${d.status === 'overdue' ? '' : 't-mute'}`}>{review(d) ? t('cc.pending') : when(d)}</span></span>
                <span className="t-sm w7">{money(d.amount - d.paid, d.currency)}</span>
                <span className="row g12">{pdfBtn(d)}{!review(d) && <button className="cc-link" disabled={preview} onClick={() => pay(d)}>{t('cc.pay.btn')}</button>}</span>
              </div>
            ))}
            {coming.map((c) => (
              <div key={c.number} className="cc-next">
                <span className="col g2"><span className="t-sm"><b>{c.number}</b> · {monthName(c.date.slice(0, 7), lang)}</span><span className="t-xs t-mute">{t('pg.c.coming', { d: shortDate(c.date, lang) })}</span></span>
                <span className="t-sm w7">{money(c.amount, projects.find((p) => p.next?.number === c.number)?.currency)}</span>
                <span />
              </div>
            ))}
          </div>
        </div>
      )}

      {paid.length > 0 && (
        <details className="cc-fold"><summary>{t('pg.c.paidList', { n: String(paid.length) })}</summary>
          {paid.map((d) => <div key={d.id} className="cc-next"><span className="t-sm"><b>{d.number}</b> · {monthName(d.billingMonth, lang)}</span><span className="t-sm">✓ {money(d.amount, d.currency)}</span>{pdfBtn(d) || <span />}</div>)}
        </details>
      )}
      {recibos.length > 0 && (
        <details className="cc-fold"><summary>{t('pg.c.recibos', { n: String(recibos.length) })}</summary>
          {recibos.map((d) => <div key={d.id} className="cc-next"><span className="col g2" style={{ minWidth: 0 }}><span className="t-sm"><b>{d.number}</b>{d.paidOn ? ` · ${shortDate(d.paidOn, lang)}` : ''}</span><span className="t-xs t-mute">{t('cc.covers', { list: d.covers.map((c) => c.number).join(', ') })}</span></span><span className="t-sm">{money(d.amount, d.currency)}</span>{pdfBtn(d) || <span />}</div>)}
        </details>
      )}
      {!preview && (
        <details className="cc-fold" hidden={nDocs === 0}><summary>{t('pg.c.docs')}{nDocs ? ` · ${nDocs}` : ''}</summary>
          <BillingFiles brandId={brandId} bare onCount={setNDocs} />
        </details>
      )}
      {paying && <PayDialog brandId={brandId} doc={paying} feePct={feePct} onClose={() => { setPaying(null); reload(); }} />}
    </div>
  );
}
