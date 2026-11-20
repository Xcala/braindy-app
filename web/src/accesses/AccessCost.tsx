import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import type { AppStatus, Payer, Subscription } from './useAccesses';

export type Cost = { isSub: boolean; sub: Subscription; payer: Payer | null; renews: string; status: AppStatus };

const PAYERS: [Payer | null, StringKey][] = [['client', 'acc.payClient'], ['braindy', 'acc.payBraindy'], [null, 'acc.payNone']];

/** What the app costs, who pays it, when it renews and whether it is in use. Part of the add / edit form. */
export function AccessCost({ c, set }: { c: Cost; set: (p: Partial<Cost>) => void }) {
  const { t } = useI18n();
  const sub = (p: Partial<Subscription>) => set({ sub: { ...c.sub, ...p } });
  return (
    <fieldset className="col g12" style={{ border: 0, padding: 0, margin: 0 }}>
      <label className="row g8 t-sm" style={{ cursor: 'pointer' }}>
        <input type="checkbox" checked={c.isSub} onChange={(e) => set({ isSub: e.target.checked })} /> {t('acc.isSub')}
      </label>
      {c.isSub && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="field"><label htmlFor="acc-plan">{t('acc.plan')}</label>
            <input id="acc-plan" className="input" value={c.sub.plan ?? ''} onChange={(e) => sub({ plan: e.target.value })} maxLength={80} placeholder="Pro" /></div>
          <div className="field"><label htmlFor="acc-price">{t('acc.price')}</label>
            <input id="acc-price" className="input" type="number" min={0} step="0.01" inputMode="decimal" value={c.sub.price ?? ''}
              onChange={(e) => sub({ price: e.target.value === '' ? null : Number(e.target.value) })} /></div>
          <div className="field"><label htmlFor="acc-cur">{t('acc.currency')}</label>
            <select id="acc-cur" className="input" value={c.sub.currency ?? 'USD'} onChange={(e) => sub({ currency: e.target.value as Subscription['currency'] })}>
              <option>USD</option><option>COP</option><option>EUR</option></select></div>
          <div className="field"><label htmlFor="acc-per">{t('acc.period')}</label>
            <select id="acc-per" className="input" value={c.sub.period ?? 'month'} onChange={(e) => sub({ period: e.target.value as Subscription['period'] })}>
              <option value="month">{t('acc.monthly')}</option><option value="year">{t('acc.yearly')}</option>
              <option value="usage">{t('acc.usage')}</option><option value="once">{t('acc.once')}</option></select></div>
          <div className="field"><label htmlFor="acc-renews">{t('acc.renews')}</label>
            <input id="acc-renews" className="input" type="date" value={c.renews} onChange={(e) => set({ renews: e.target.value })} /></div>
          <div className="field"><label htmlFor="acc-status">{t('acc.status')}</label>
            <select id="acc-status" className="input" value={c.status} onChange={(e) => set({ status: e.target.value as AppStatus })}>
              <option value="active">{t('acc.statusActive')}</option><option value="paused">{t('acc.statusPaused')}</option><option value="cancelled">{t('acc.statusCancelled')}</option></select></div>
        </div>
      )}
      <div className="field">
        <span id="acc-payer" className="label">{t('acc.payer')}</span>
        <div className="row g8 wrap" role="radiogroup" aria-labelledby="acc-payer">
          {PAYERS.map(([v, k]) => (
            <button key={k} type="button" role="radio" aria-checked={c.payer === v} className={`btn btn-sm ${c.payer === v ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => set({ payer: v })}>{t(k)}</button>
          ))}
        </div>
      </div>
    </fieldset>
  );
}
