import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { cuentasApi, money, type Agreement } from '../api';
import '../cuentas.css';

const pct = (n: number, total: number) => (total > 0 ? Math.min(100, Math.round((n / total) * 100)) : 0);
const STEPS = [0, 25, 50, 75, 100];

/** Paid vs work done on one project, one bar under the other. Work done is the average of the project's stages (its
 *  packs), each marked by NickMark at 0, 25, 50, 75 or 100 %. One line says which runs ahead. */
export function ProjectBars({ brandId, agreement: a, paid, onSaved }: { brandId: string; agreement: Agreement; paid: number; onSaved: () => void }) {
  const { t } = useI18n();
  const stages = a.packs ?? [];
  const [prog, setProg] = useState<number[]>(stages.map((_, i) => a.stageProgress?.[i] ?? 0));
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const p = pct(paid, a.totalAmount);
  const w = stages.length ? Math.round(prog.reduce((s, v) => s + v, 0) / stages.length) : null;
  const done = prog.filter((v) => v === 100).length;
  const gap = w === null ? 0 : p - w;
  const verdict = w === null ? null : gap > 10 ? 'cc.pb.payAhead' : gap < -10 ? 'cc.pb.workAhead' : 'cc.pb.even';
  const save = async () => { setBusy(true); try { await cuentasApi.stages(brandId, a.id, prog); setEdit(false); onSaved(); } finally { setBusy(false); } };

  return (
    <div className="col g8">
      <div className="cc-pb">
        <span className="t-xs w7">{t('cc.pb.paid')}</span>
        <div className="cc-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p} aria-label={t('cc.pr.label', { p: String(p) })}><span className="is-paid" style={{ width: `${p}%` }} /></div>
        <span className="t-xs t-mute">{p}% · {t('cc.pb.left', { v: money(Math.max(0, a.totalAmount - paid), a.currency) })}</span>
      </div>
      <div className="cc-pb">
        <span className="t-xs w7">{t('cc.pb.work')}</span>
        {w === null ? <span className="t-xs t-mute" style={{ gridColumn: '2 / -1' }}>{t('cc.pb.noData')}</span> : (
          <>
            <div className="cc-bar is-work" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={w} aria-label={t('cc.pb.workLabel', { p: String(w) })}><span className="is-paid" style={{ width: `${w}%` }} /></div>
            <span className="t-xs t-mute">{w}% · {t('cc.pb.stages', { d: String(done), n: String(stages.length) })}</span>
          </>
        )}
      </div>
      <div className="row between g8 wrap">
        <p className="t-xs t-mute" style={{ margin: 0 }}>{verdict && <b>{t(verdict as never)}</b>}</p>
        {stages.length > 0 && !edit && <button className="btn btn-ghost btn-sm" onClick={() => setEdit(true)}>{t('cc.pb.mark')}</button>}
      </div>
      {edit && (
        <div className="col g8" style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--line)' }}>
          {stages.map((s, i) => (
            <div key={i} className="cc-stage">
              <label className="t-sm" htmlFor={`st-${a.id}-${i}`} style={{ minWidth: 0 }}><b>{s.name}</b></label>
              <select id={`st-${a.id}-${i}`} className="input" value={prog[i]} onChange={(e) => setProg(prog.map((v, j) => (j === i ? Number(e.target.value) : v)))}>
                {STEPS.map((v) => <option key={v} value={v}>{v === 0 ? t('cc.pb.s0') : v === 100 ? t('cc.pb.s100') : `${v}%`}</option>)}
              </select>
            </div>
          ))}
          <div className="row g8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setProg(stages.map((_, i) => a.stageProgress?.[i] ?? 0)); setEdit(false); }}>{t('common.cancel')}</button>
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{t('set.save')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
