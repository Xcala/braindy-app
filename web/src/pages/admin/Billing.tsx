import { useEffect, useState } from 'react';
import { collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { billingApi, money, type Plan } from '../../billing/useBilling';

type Row = Plan & { brandId: string };
type Transfer = { id: string; brandId: string; reference: string; amount: number | null };

/** Admin · Billing (design 20): recurring revenue, transfers to confirm, overdue, plan per client. */
export function AdminBilling() {
  const { brands } = useBrands();
  const { t, lang } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Plan>({ path: 'continuity', currency: 'usd' });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    getDocs(collectionGroup(db, 'billing')).then((s) => setRows(s.docs.filter((d) => d.id === 'plan').map((d) => ({ brandId: d.ref.parent.parent!.id, ...(d.data() as Plan) }))));
    getDocs(query(collectionGroup(db, 'transfers'), where('status', '==', 'review'))).then((s) =>
      setTransfers(s.docs.map((d) => ({ id: d.id, brandId: d.ref.parent.parent!.id, reference: d.get('reference'), amount: d.get('amount') ?? null }))));
  }, [tick]);
  const name = (id: string) => brands.find((b) => b.id === id)?.name ?? id;
  const mrr = rows.filter((r) => r.status === 'active').reduce((n, r) => n + (r.monthly ?? 0), 0);
  const cur = rows.find((r) => r.currency)?.currency ?? 'usd';

  async function savePlan() {
    if (!editing) return;
    await billingApi.setPlan(editing, form); setEditing(null); setTick((x) => x + 1);
  }

  return (
    <div className="col g24">
      <div className="col g8"><p className="label">{t('bill.a.only')}</p><h1 className="h1">{t('set.tab.billing')}</h1></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card col g4"><span className="t-sm t-mute w7">{t('bill.a.mrr')}</span><span className="h1">{money(mrr, cur, lang)}</span></div>
        <div className="card col g4"><span className="t-sm t-mute w7">{t('bill.a.active')}</span><span className="h1">{rows.filter((r) => r.status === 'active').length}</span></div>
        <div className="card col g4" style={transfers.length ? { borderColor: '#F5D98A', background: '#FFFBF0' } : undefined}><span className="t-sm t-mute w7">{t('bill.a.toConfirm')}</span><span className="h1">{transfers.length}</span></div>
        <div className="card col g4"><span className="t-sm t-mute w7">{t('bill.a.overdue')}</span><span className="h1">{rows.filter((r) => r.status === 'past_due').length}</span></div>
      </div>
      {transfers.map((x) => (
        <div key={x.id} className="card row between g12 wrap" style={{ borderColor: '#F5D98A' }}>
          <span className="t-sm"><b>{name(x.brandId)}</b> · {t('bill.a.transferOf', { amount: money(x.amount, cur, lang) })} · {x.reference}</span>
          <button className="btn btn-primary btn-sm" onClick={() => billingApi.confirmTransfer(x.brandId, x.id).then(() => setTick((n) => n + 1))}>{t('bill.a.confirm')}</button>
        </div>
      ))}
      <div className="table overflow-x-auto">
        <div className="trow head label min-w-[680px]" style={{ gridTemplateColumns: 'minmax(0,1.4fr) 1fr 1fr 1fr 120px' }}>
          <span>{t('admin.brands.colBrand')}</span><span>{t('bill.a.path')}</span><span>{t('bill.a.amount')}</span><span>{t('bill.a.status')}</span><span />
        </div>
        {brands.filter((b) => b.status === 'active' && b.kind === 'brand').map((b) => {
          const r = rows.find((x) => x.brandId === b.id);
          return (
            <div key={b.id} className="trow min-w-[680px]" style={{ gridTemplateColumns: 'minmax(0,1.4fr) 1fr 1fr 1fr 120px' }}>
              <span className="w7 truncate">{b.name}</span>
              <span className="t-sm">{r?.path ? t(`bill.path.${r.path}`) : '—'}</span>
              <span className="t-sm">{r?.monthly ? `${money(r.monthly, r.currency, lang)} / ${t('pay.month')}` : r?.project ? money(r.project, r.currency, lang) : '—'}</span>
              <span className="t-sm">{r ? t(`bill.status.${r.status ?? 'pending'}`) : '—'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(b.id); setForm({ path: r?.path ?? 'continuity', monthly: r?.monthly ?? null, project: r?.project ?? null, currency: r?.currency ?? 'usd', agentsMonthly: r?.agentsMonthly ?? null }); }}>{r ? t('bill.edit') : t('bill.a.setPlan')}</button>
            </div>
          );
        })}
      </div>
      {editing && (
        <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal w-full max-w-[480px]" role="dialog" aria-modal="true" aria-labelledby="plan-h">
            <h2 className="h2" id="plan-h">{t('bill.a.planFor', { name: name(editing) })}</h2>
            <div className="field"><label htmlFor="pl-path">{t('bill.a.path')}</label>
              <select id="pl-path" className="input" value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value as Plan['path'] })}>
                {(['transform', 'continuity', 'launch'] as const).map((p) => <option key={p} value={p}>{t(`bill.path.${p}`)}</option>)}
              </select></div>
            <div className="field"><label htmlFor="pl-ag">{t('bill.a.agents')}</label><input id="pl-ag" className="input" inputMode="decimal" value={form.agentsMonthly ?? ''} onChange={(e) => setForm({ ...form, agentsMonthly: Number(e.target.value) || null })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="field"><label htmlFor="pl-m">{t('bill.a.monthly')}</label><input id="pl-m" className="input" inputMode="decimal" value={form.monthly ?? ''} onChange={(e) => setForm({ ...form, monthly: Number(e.target.value) || null })} /></div>
              <div className="field"><label htmlFor="pl-p">{t('bill.a.project')}</label><input id="pl-p" className="input" inputMode="decimal" value={form.project ?? ''} onChange={(e) => setForm({ ...form, project: Number(e.target.value) || null })} /></div>
              <div className="field"><label htmlFor="pl-c">{t('bill.a.currency')}</label>
                <select id="pl-c" className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}><option value="usd">USD</option><option value="cop">COP</option></select></div>
            </div>
            <div className="row g12" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={savePlan}>{t('set.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
