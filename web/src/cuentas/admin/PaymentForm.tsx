import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { cuentasApi, errKey, toMinor, type Agreement, type Cuenta } from '../api';
import { PayProgress } from './PayProgress';

/** «Registrar pago» under its own project: how much is paid and left, and what this payment would make it. */
export function PaymentForm({ brandId, agreement, docs, onDone, onCancel }: { brandId: string; agreement: Agreement; docs: Cuenta[]; onDone: (msg: string) => void; onCancel?: () => void }) {
  const { t } = useI18n();
  const cur = agreement.currency ?? 'COP';
  const [pay, setPay] = useState({ amount: '', date: new Date().toLocaleDateString('en-CA'), method: cur === 'USD' ? 'Transfer' : 'Transferencia', receipt: true });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const id = (k: string) => `py-${agreement.id}-${k}`;

  async function record() {
    setBusy(true); setErr(null);
    try {
      const r = await cuentasApi.pay(brandId, { agreementId: agreement.id, amount: toMinor(pay.amount, cur), date: pay.date, method: pay.method, receipt: pay.receipt });
      onDone(t('cc.a.pay.done', { r: r.receipt ? ` · ${r.receipt.number}` : '' }));
    } catch (e) { setErr(t(errKey(e) as never)); } finally { setBusy(false); }
  }

  return (
    <div className="col g12" style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--line)' }} aria-label={t('cc.a.payment')} role="group">
      <p className="label" style={{ margin: 0 }}>{t('cc.a.payment')}</p>
      <PayProgress agreement={agreement} docs={docs} next={toMinor(pay.amount, cur)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="field"><label htmlFor={id('v')}>{t('cc.a.pay.amount')} ({cur})</label><input id={id('v')} className="input" inputMode="decimal" autoFocus value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></div>
        <div className="field"><label htmlFor={id('d')}>{t('cc.a.pay.date')}</label><input id={id('d')} className="input" type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></div>
        <div className="field"><label htmlFor={id('m')}>{t('cc.a.pay.method')}</label><input id={id('m')} className="input" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} /></div>
      </div>
      {err && <p className="t-sm" role="alert">{err}</p>}
      <div className="row between g12 wrap">
        <label className="row g8 t-sm"><input type="checkbox" checked={pay.receipt} onChange={(e) => setPay({ ...pay, receipt: e.target.checked })} />{t('cc.a.pay.receipt')}</label>
        <span className="row g8">
          {onCancel && <button className="btn btn-secondary btn-sm" disabled={busy} onClick={onCancel}>{t('common.cancel')}</button>}
          <button className="btn btn-primary btn-sm" disabled={busy || !toMinor(pay.amount, cur)} onClick={record}>{busy ? <span className="cc-spin" aria-hidden="true" /> : null} {t('cc.a.pay.save')}</button>
        </span>
      </div>
    </div>
  );
}
