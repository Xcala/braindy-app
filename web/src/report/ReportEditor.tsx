import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { saveReport, type Report } from './useReports';

const thisMonth = () => new Date().toISOString().slice(0, 7);

/** Admin: fill in the numbers that come from outside (CRM, ads) and the Brains' lines, then publish. */
export function ReportEditor({ brandId, existing }: { brandId: string; existing: Report[] }) {
  const { t } = useI18n();
  const [month, setMonth] = useState(existing[0]?.month ?? thisMonth());
  const base = existing.find((r) => r.month === month);
  const [f, setF] = useState<Partial<Report>>({});
  const [leads, setLeads] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    setF(base ?? {});
    setLeads((base?.leadsByMonth ?? []).map((x) => `${x.month}=${x.n}`).join(', '));
  }, [month, base?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const n = (k: keyof Report) => (
    <div className="field"><label htmlFor={`r-${k}`}>{t(`rep.f.${k}` as never)}</label>
      <input id={`r-${k}`} className="input" inputMode="decimal" value={(f[k] as number | null) ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );
  async function save(published: boolean) {
    setMsg(null);
    const leadsByMonth = leads.split(',').map((s) => s.trim()).filter(Boolean).map((s) => { const [m, v] = s.split('='); return { month: m.trim(), n: Number(v) || 0 }; });
    try {
      const r = await saveReport(brandId, month, { ...f, leadsByMonth, published });
      setMsg(t('rep.savedCount', { n: r.pieces }));
    } catch { setMsg(t('rep.saveError')); }
  }

  return (
    <section className="card col g16" style={{ borderStyle: 'dashed' }} aria-labelledby="rep-edit">
      <div className="row between g8 wrap"><h2 className="h3" id="rep-edit">{t('rep.editTitle')}</h2><span className="chip c-group">{t('role.admin')}</span></div>
      <div className="field" style={{ maxWidth: 220 }}><label htmlFor="r-month">{t('rep.month')}</label>
        <input id="r-month" className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
      <div className="grid gap-4 md:grid-cols-4">{n('salesAttributed')}{n('salesPrev')}{n('leads')}{n('costPerLead')}</div>
      <div className="field"><label htmlFor="r-lbm">{t('rep.f.leadsByMonth')}</label>
        <input id="r-lbm" className="input" value={leads} onChange={(e) => setLeads(e.target.value)} placeholder="2026-07=12, 2026-08=18" /></div>
      <div className="field"><label htmlFor="r-moved">{t('rep.f.whatMoved')}</label>
        <textarea id="r-moved" className="input" rows={2} value={f.whatMoved ?? ''} onChange={(e) => setF({ ...f, whatMoved: e.target.value })} style={{ height: 'auto', paddingTop: 10 }} /></div>
      <div className="field"><label htmlFor="r-next">{t('rep.f.nextMonth')}</label>
        <textarea id="r-next" className="input" rows={3} value={f.nextMonth ?? ''} onChange={(e) => setF({ ...f, nextMonth: e.target.value })} style={{ height: 'auto', paddingTop: 10 }} /></div>
      <p className="help">{t('rep.countedHelp')}</p>
      <div className="row g12 wrap">
        <button className="btn btn-secondary" onClick={() => save(false)}>{t('rep.saveDraft')}</button>
        <button className="btn btn-primary" onClick={() => save(true)}>{t('rep.publish')}</button>
        {msg && <span className="t-sm" role="status">{msg}</span>}
      </div>
    </section>
  );
}
