import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { cuentasApi, errKey, money, type Agreement, type Cuenta } from '../api';
import { PaymentForm } from './PaymentForm';
import { paidOf } from './PayProgress';
import { ProjectBars } from './ProjectBars';

/** One project charged in cuentas: its name alone, then «$6.500.000 · 6 cuotas · numeración BM-06-01 a BM-06-06»,
 *  paid vs work done, «Envío automático» (on or off any time, and the issue day) and «Registrar un pago». */
export function ProjectCard({ brandId, a, docs, onEdit, onSaved }: { brandId: string; a: Agreement; docs: Cuenta[]; onEdit: () => void; onSaved: (msg?: string) => void }) {
  const { t } = useI18n();
  const [paying, setPaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const paid = paidOf(a, docs);
  const num = (i: number) => `${a.numberingPrefix}-${String(i).padStart(2, '0')}`;
  const live = a.status !== 'draft';
  async function sending(x: { autoSend?: boolean; issueDay?: number }) {
    setBusy(true); setErr(null);
    try { await cuentasApi.sending(brandId, a.id, x); onSaved(); } catch (e) { setErr(t(errKey(e) as never)); } finally { setBusy(false); }
  }

  return (
    <div className="card card-tight col g12">
      <div className="row between g12 wrap" style={{ alignItems: 'flex-start' }}>
        <span className="col g2" style={{ minWidth: 0, flex: '1 1 16rem' }}>
          <span className="t-sm w7">{a.title}</span>
          <span className="t-xs t-mute">{t('pg.a.line', { total: money(a.totalAmount, a.currency), n: String(a.installments), from: num(1), to: num(a.installments) })}{a.currency === 'USD' ? ' · USA' : ''}</span>
        </span>
        <span className="row g8 wrap">
          <span className="chip">{t(`cc.a.${a.status}` as never)}</span>
          {a.status === 'draft' && <button className="btn btn-ghost btn-sm" onClick={onEdit}>{t('bill.edit')}</button>}
        </span>
      </div>
      {live && <ProjectBars key={`${(a.stageProgress ?? []).join()}-${(a.stageValue ?? []).join()}`} brandId={brandId} agreement={a} paid={paid} onSaved={() => onSaved()} />}
      {a.status === 'active' && (
        <div className="cc-switch" style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--line)' }}>
          <input id={`auto-${a.id}`} type="checkbox" role="switch" checked={!!a.autoSend} disabled={busy} onChange={(e) => sending({ autoSend: e.target.checked })} />
          <span className="col g4" style={{ minWidth: 0, flex: 1 }}>
            <label htmlFor={`auto-${a.id}`} className="t-sm w7">{t('pg.a.auto')}</label>
            <span className="t-xs t-mute">{a.autoSend ? t('pg.a.autoOn', { d: String(a.issueDay) }) : t('pg.a.autoOff')}</span>
            {err && <span className="t-xs" role="alert">{err}</span>}
          </span>
          <label className="col g2 t-xs">{t('pg.a.day')}
            <select className="input cc-st-sel" value={a.issueDay} disabled={busy} onChange={(e) => sending({ issueDay: Number(e.target.value) })}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{t('pg.a.dayOf', { d: String(d) })}</option>)}
            </select>
          </label>
        </div>
      )}
      {a.status === 'active' && paid < a.totalAmount && (
        paying ? <PaymentForm brandId={brandId} agreement={a} docs={docs} onCancel={() => setPaying(false)} onDone={(m) => { setPaying(false); onSaved(m); }} />
          : <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-secondary btn-sm" onClick={() => setPaying(true)}>{t('cc.a.payment')}</button></div>
      )}
    </div>
  );
}
