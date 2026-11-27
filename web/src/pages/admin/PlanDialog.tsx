import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { billingApi, HOSTING, type Plan } from '../../billing/useBilling';
import { PeriodPick } from '../../components/PeriodPick';
import { SiteHostingAdmin, type HostRow } from './SiteHostingAdmin';

const num = (s: string) => Number(s.replace(',', '.')) || null;

/** Admin › Billing · the plan window of one brand (FA2/FA3): plan type and currency as visible buttons (FOR-1), amounts,
 *  hosting plan, and the website hosting block (link site, pause/resume) in the same window. */
export function PlanDialog({ brandId, name, row, onClose, reload }: { brandId: string; name: string; row?: HostRow; onClose: () => void; reload: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState<Plan>({ path: row?.path ?? 'continuity', monthly: row?.monthly ?? null, project: row?.project ?? null, currency: row?.currency ?? 'usd', agentsMonthly: row?.agentsMonthly ?? null, hosting: row?.hosting ?? null });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  async function save() {
    setBusy(true); setErr(false);
    try { await billingApi.setPlan(brandId, form); reload(); onClose(); } catch { setErr(true); } finally { setBusy(false); }
  }

  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal w-full max-w-[30rem]" role="dialog" aria-modal="true" aria-labelledby="plan-h" style={{ maxHeight: 'calc(100dvh - 2rem)', overflowY: 'auto' }}>
        <h2 className="h2" id="plan-h">{t('bill.a.planFor', { name })}</h2>
        <div className="field"><span className="label">{t('bill.a.path')}</span>
          <PeriodPick label={t('bill.a.path')} value={form.path ?? 'continuity'} onChange={(path) => setForm({ ...form, path })}
            options={(['transform', 'continuity', 'launch'] as const).map((p) => ({ value: p, label: t(`bill.path.${p}`) }))} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="field"><label htmlFor="pl-m">{t('bill.a.monthly')}</label><input id="pl-m" className="input" inputMode="decimal" value={form.monthly ?? ''} onChange={(e) => setForm({ ...form, monthly: num(e.target.value) })} /></div>
          <div className="field"><label htmlFor="pl-p">{t('bill.a.project')}</label><input id="pl-p" className="input" inputMode="decimal" value={form.project ?? ''} onChange={(e) => setForm({ ...form, project: num(e.target.value) })} /></div>
        </div>
        <div className="field"><span className="label">{t('bill.a.currency')}</span>
          <PeriodPick label={t('bill.a.currency')} value={form.currency ?? 'usd'} onChange={(currency) => setForm({ ...form, currency })}
            options={[{ value: 'usd', label: 'USD' }, { value: 'cop', label: 'COP' }]} /></div>
        <div className="field"><label htmlFor="pl-ag">{t('bill.a.agents')}</label><input id="pl-ag" className="input" inputMode="decimal" value={form.agentsMonthly ?? ''} onChange={(e) => setForm({ ...form, agentsMonthly: num(e.target.value) })} /></div>
        <div className="field"><label htmlFor="pl-h">{t('plan.hosting')}</label>
          <select id="pl-h" className="input" value={form.hosting ?? ''} onChange={(e) => setForm({ ...form, hosting: (e.target.value || null) as Plan['hosting'] })}>
            <option value="">—</option>{HOSTING.map((h) => <option key={h} value={h}>{t(`plan.h.${h}`)}</option>)}
          </select></div>
        {err && <p role="alert" className="t-sm" style={{ color: 'var(--danger)' }}>{t('bill.a.saveErr')}</p>}
        <div className="row g12" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save()}>{t('set.save')}</button>
        </div>
        <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: 0 }} />
        <SiteHostingAdmin brandId={brandId} brandName={name} row={row} reload={reload} />
      </div>
    </div>
  );
}
