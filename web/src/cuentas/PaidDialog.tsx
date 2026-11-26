import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { cop, cuentasApi, errKey, readAsDataUrl, type Cuenta } from './api';

/** The client's «Ya pagué»: proof + date + amount. NickMark confirms it, then the recibo goes out. */
export function PaidDialog({ brandId, doc, onClose }: { brandId: string; doc: Cuenta; onClose: () => void }) {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [amount, setAmount] = useState(String(doc.amount - doc.paid));
  const [method, setMethod] = useState('Transferencia');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setState('busy'); setErr(null);
    try {
      await cuentasApi.paid(brandId, doc.id, { proof: await readAsDataUrl(file), date, amount: Number(amount.replace(/\D/g, '')) || 0, method });
      setState('done');
    } catch (x) { setErr(t(errKey(x) as never)); setState('idle'); }
  }

  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal w-full max-w-[28rem] col g12" role="dialog" aria-modal="true" aria-labelledby="paid-h" onSubmit={submit}>
        <h2 className="h2" id="paid-h">{t('cc.paid.title', { n: doc.number })}</h2>
        <p className="t-sm t-mute">{cop(doc.amount)}</p>
        {state === 'done' ? (
          <>
            <p className="t-sm" role="status">{t('cc.paid.done')}</p>
            <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn btn-primary" onClick={onClose}>OK</button></div>
          </>
        ) : (
          <>
            <div className="field"><label htmlFor="pd-f">{t('cc.paid.proof')}</label>
              <input id="pd-f" className="input" type="file" accept="image/png,image/jpeg,application/pdf" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="field"><label htmlFor="pd-d">{t('cc.paid.date')}</label><input id="pd-d" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="field"><label htmlFor="pd-a">{t('cc.paid.amount')}</label><input id="pd-a" className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            </div>
            <div className="field"><label htmlFor="pd-m">{t('cc.paid.method')}</label><input id="pd-m" className="input" value={method} onChange={(e) => setMethod(e.target.value)} /></div>
            {err && <p className="t-sm" role="alert">{err}</p>}
            <div className="row g12" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
              <button className="btn btn-primary" disabled={!file || state === 'busy'}>{t('cc.paid.send')}</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
