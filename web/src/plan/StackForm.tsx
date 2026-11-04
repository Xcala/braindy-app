import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { AddBtn, Chips, DateF, F, Item, Num, Txt } from './formFields';
import type { StackItem, ToolCategory } from './types';

const CATS: ToolCategory[] = ['web', 'email', 'ai', 'automation', 'social', 'analytics', 'hosting', 'design', 'other'];
const EMPTY_APP: StackItem = { name: '', category: 'web', currency: 'usd', period: 'month', payer: 'braindy', status: 'active' };

/** Admin form for the apps stack: one card per paid app, what it is for, cost, who pays and when it renews. */
export function StackForm({ v, set }: { v: StackItem[]; set: (v: StackItem[]) => void }) {
  const { t } = useI18n();
  const upApp = (i: number, p: Partial<StackItem>) => set(v.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="col g12">
      {!v.length && <p className="t-sm t-mute" style={{ margin: 0 }}>{t('pf.noApps')}</p>}
      {v.map((a, i) => (
        <Item key={i} title={a.name || `${t('pf.app')} ${i + 1}`} onRemove={() => set(v.filter((_, j) => j !== i))}>
          <div className="pf-grid">
            <F label={t('pf.name')}><Txt value={a.name} set={(x) => upApp(i, { name: x })} ph="Webflow" /></F>
            <F label={t('pf.category')}>
              <select className="input" value={a.category} onChange={(e) => upApp(i, { category: e.target.value as ToolCategory })}>
                {CATS.map((c) => <option key={c} value={c}>{t(`plan.cat.${c}` as StringKey)}</option>)}
              </select>
            </F>
            <F label={t('pf.purpose')} wide><Txt value={a.purpose} set={(x) => upApp(i, { purpose: x })} /></F>
            <F label={t('pf.planName')}><Txt value={a.plan} set={(x) => upApp(i, { plan: x })} /></F>
            <F label={t('pf.cost')}><Num value={a.cost} set={(x) => upApp(i, { cost: x })} /></F>
            <F label={t('pf.currency')} group><Chips value={a.currency} set={(x) => upApp(i, { currency: x })} options={[['usd', 'USD'], ['cop', 'COP']]} /></F>
            <F label={t('pf.period')} group><Chips value={a.period} set={(x) => upApp(i, { period: x })} options={[['month', t('pf.month')], ['year', t('pf.year')], ['once', t('pf.once')], ['usage', t('pf.usage')]]} /></F>
            <F label={t('pf.payer')} wide group><Chips value={a.payer} set={(x) => upApp(i, { payer: x })} options={[['braindy', t('pf.payBraindy')], ['client', t('pf.payClient')]]} /></F>
            <F label={t('pf.renews')}><DateF value={a.renews} set={(x) => upApp(i, { renews: x })} /></F>
            <F label={t('pf.url')}><Txt value={a.url} set={(x) => upApp(i, { url: x })} ph="https://" /></F>
            <F label={t('pf.status')} wide group><Chips value={a.status} set={(x) => upApp(i, { status: x })} options={[['active', t('pf.appActive')], ['paused', t('pf.appPaused')], ['cancelled', t('pf.appCancelled')]]} /></F>
            <F label={t('pf.note')} wide><Txt value={a.note} set={(x) => upApp(i, { note: x })} /></F>
          </div>
        </Item>
      ))}
      <AddBtn label={t('pf.addApp')} onClick={() => set([...v, EMPTY_APP])} />
    </div>
  );
}
