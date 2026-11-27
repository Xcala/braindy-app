import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { cuentasApi, errKey, money, monthName, type Cuenta } from './api';
import { PaidDialog } from './PaidDialog';
import './cuentas.css';

/** «Pagar» on a cuenta: by card (Stripe Checkout, the recibo comes out by itself) or by bank transfer (pay to the
 *  account on the PDF, then upload the proof for NickMark to confirm). */
export function PayDialog({ brandId, doc, feePct, onClose }: { brandId: string; doc: Cuenta; feePct: number; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [mode, setMode] = useState<'pick' | 'card' | 'transfer'>('pick');
  const [err, setErr] = useState<string | null>(null);
  const owed = doc.amount - doc.paid;
  // Same rounding as the server: the client pays the card fee on top.
  const fee = Math.round((owed * feePct) / 100);

  async function card() {
    setMode('card'); setErr(null);
    try { const { url } = await cuentasApi.checkout(brandId, doc.id, lang); window.location.href = url; }
    catch (e) { setErr(t(errKey(e) as never)); setMode('pick'); }
  }
  if (mode === 'transfer') return <PaidDialog brandId={brandId} doc={doc} onClose={onClose} />;

  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && mode !== 'card' && onClose()}>
      <div className="modal w-full max-w-[28rem] col g16" role="dialog" aria-modal="true" aria-labelledby="cc-pay-h">
        <div className="col g4">
          <h2 className="h2" id="cc-pay-h">{t('cc.pay.title', { n: doc.number })}</h2>
          <p className="t-sm t-mute">{monthName(doc.billingMonth, lang)} · <b>{money(owed, doc.currency)}</b></p>
        </div>
        <div className="col g8">
          <button className="btn btn-primary" disabled={mode === 'card'} onClick={card} style={{ justifyContent: 'flex-start' }}>
            {mode === 'card' ? <><span className="cc-spin" aria-hidden="true" /> {t('cc.pay.opening')}</> : t('cc.pay.card')}
          </button>
          <p className="t-xs t-mute" style={{ margin: 0 }}>{fee > 0 ? t('cc.pay.cardFee', { pct: String(feePct), fee: money(fee, doc.currency), total: money(owed + fee, doc.currency) }) + ' ' : ''}{t('cc.pay.cardHint')}</p>
          <button className="btn btn-secondary" disabled={mode === 'card'} onClick={() => setMode('transfer')} style={{ justifyContent: 'flex-start', marginTop: '0.5rem' }}>{t('cc.pay.transfer')}</button>
          <p className="t-xs t-mute" style={{ margin: 0 }}>{t('cc.pay.transferHint')}</p>
        </div>
        {err && <p className="t-sm" role="alert">{err}</p>}
        <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-ghost" disabled={mode === 'card'} onClick={onClose}>{t('common.cancel')}</button></div>
      </div>
    </div>
  );
}
