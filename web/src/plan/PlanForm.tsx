import { useI18n } from '../i18n/I18nProvider';
import { AddBtn, Area, Chips, DateF, F, Item, Lines, Num, Sec, Txt } from './formFields';
import type { BrandPlan, Care, Pack } from './types';

export const EMPTY_PACK: Pack = { name: '', period: 'once', status: 'pending', includes: [], excludes: [] };
export const EMPTY_PLAN: BrandPlan = { title: '', currency: 'cop', status: 'active', packs: [EMPTY_PACK], payment: [], notIncluded: [] };
const EMPTY_CARE: Care = { name: '', period: 'month', includes: [], excludes: [], metrics: [] };

/** Admin form for what the brand contracted: the basics, each pack, total and payment, and the maintenance plan. */
export function PlanForm({ v, set }: { v: BrandPlan; set: (v: BrandPlan) => void }) {
  const { t } = useI18n();
  const up = (p: Partial<BrandPlan>) => set({ ...v, ...p });
  const upPack = (i: number, p: Partial<Pack>) => up({ packs: v.packs.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const care = v.care;
  const upCare = (p: Partial<Care>) => up({ care: { ...care!, ...p } });

  return (
    <div className="col g16">
      <Sec title={t('pf.general')}>
        <div className="pf-grid">
          <F label={t('pf.title')} wide><Txt value={v.title} set={(x) => up({ title: x })} /></F>
          <F label={t('pf.summary')} wide><Area value={v.summary} set={(x) => up({ summary: x })} /></F>
          <F label={t('pf.start')}><DateF value={v.start} set={(x) => up({ start: x })} /></F>
          <F label={t('pf.end')}><DateF value={v.end} set={(x) => up({ end: x })} /></F>
          <F label={t('pf.currency')} group><Chips value={v.currency} set={(x) => up({ currency: x })} options={[['cop', 'COP'], ['usd', 'USD']]} /></F>
          <F label={t('pf.status')} group><Chips value={v.status} set={(x) => up({ status: x })} options={[['active', t('plan.status.active')], ['paused', t('plan.status.paused')], ['done', t('plan.status.done')]]} /></F>
        </div>
      </Sec>

      <Sec title={t('pf.packs')}>
        {v.packs.map((p, i) => (
          <Item key={i} title={[p.label, p.name].filter(Boolean).join(' · ') || `${t('pf.pack')} ${i + 1}`} onRemove={() => up({ packs: v.packs.filter((_, j) => j !== i) })}>
            <div className="pf-grid">
              <F label={t('pf.label')}><Txt value={p.label} set={(x) => upPack(i, { label: x })} /></F>
              <F label={t('pf.name')}><Txt value={p.name} set={(x) => upPack(i, { name: x })} /></F>
              <F label={t('pf.subtitle')} wide><Txt value={p.subtitle} set={(x) => upPack(i, { subtitle: x })} /></F>
              <F label={t('pf.price')}><Num value={p.price} set={(x) => upPack(i, { price: x })} /></F>
              <F label={t('pf.period')} group><Chips value={p.period} set={(x) => upPack(i, { period: x })} options={[['once', t('pf.once')], ['month', t('pf.month')]]} /></F>
              {p.period === 'month' && <F label={t('pf.months')}><Num value={p.months} set={(x) => upPack(i, { months: x })} /></F>}
              <F label={t('pf.status')} wide group><Chips value={p.status} set={(x) => upPack(i, { status: x })} options={[['pending', t('plan.st.pending')], ['in_progress', t('plan.st.in_progress')], ['delivered', t('plan.st.delivered')]]} /></F>
              <F label={t('pf.includes')} wide><Lines value={p.includes} set={(x) => upPack(i, { includes: x })} /></F>
              <F label={t('pf.excludes')} wide><Lines value={p.excludes} set={(x) => upPack(i, { excludes: x })} /></F>
            </div>
          </Item>
        ))}
        <AddBtn label={t('pf.addPack')} onClick={() => up({ packs: [...v.packs, EMPTY_PACK] })} />
      </Sec>

      <Sec title={t('pf.money')}>
        <div className="pf-grid">
          <F label={t('pf.total')}><Num value={v.total?.amount} set={(x) => up({ total: x == null ? undefined : { ...v.total, amount: x } })} /></F>
          <F label={t('pf.totalLabel')}><Txt value={v.total?.label} set={(x) => v.total && up({ total: { ...v.total, label: x } })} /></F>
          <F label={t('pf.payment')} wide><Lines value={v.payment} set={(x) => up({ payment: x })} /></F>
          <F label={t('pf.notIncluded')} wide><Lines value={v.notIncluded} set={(x) => up({ notIncluded: x })} /></F>
        </div>
      </Sec>

      <Sec title={t('pf.care')}>
        <label className="row g12 pf-toggle">
          <button type="button" className={`switch ${care ? 'is-on' : ''}`} role="switch" aria-checked={!!care} onClick={() => up({ care: care ? undefined : EMPTY_CARE })} />
          <span className="w7 t-sm">{t('pf.careOn')}</span>
        </label>
        {care && (
          <div className="pf-grid">
            <F label={t('pf.name')} wide><Txt value={care.name} set={(x) => upCare({ name: x })} /></F>
            <F label={t('pf.price')}><Num value={care.price} set={(x) => upCare({ price: x })} /></F>
            <F label={t('pf.period')} group><Chips value={care.period} set={(x) => upCare({ period: x })} options={[['month', t('pf.month')], ['year', t('pf.year')]]} /></F>
            <F label={t('pf.note')} wide><Txt value={care.note} set={(x) => upCare({ note: x })} /></F>
            <F label={t('pf.hosting')} group><Chips value={care.hosting ?? ''} set={(x) => upCare({ hosting: x || undefined })} options={[['', t('pf.none')], ['esencial', 'Esencial'], ['pro', 'Pro'], ['ultra', 'Ultra']]} /></F>
            <F label={t('pf.siteUrl')}><Txt value={care.siteUrl} set={(x) => upCare({ siteUrl: x })} ph="https://" /></F>
            <F label={t('pf.startsAfter')} wide><Area value={care.startsAfter} set={(x) => upCare({ startsAfter: x })} /></F>
            <F label={t('pf.careIncludes')} wide group>
              <Pairs rows={care.includes.map((x) => [x.title, x.body ?? ''])} labels={[t('pf.itemTitle'), t('pf.itemBody')]}
                set={(rows) => upCare({ includes: rows.map(([title, body]) => ({ title, body })) })} />
            </F>
            <F label={t('pf.excludes')} wide><Lines value={care.excludes} set={(x) => upCare({ excludes: x })} /></F>
            <F label={t('pf.metrics')} wide group>
              <Pairs rows={care.metrics.map((x) => [x.value, x.label])} labels={[t('pf.value'), t('pf.metricLabel')]} narrow
                set={(rows) => upCare({ metrics: rows.map(([value, label]) => ({ value, label })) })} />
            </F>
          </div>
        )}
      </Sec>
    </div>
  );
}

/** Rows of two short texts (title + detail, figure + meaning) with add and remove. */
function Pairs({ rows, labels, set, narrow }: { rows: string[][]; labels: [string, string]; set: (r: string[][]) => void; narrow?: boolean }) {
  const { t } = useI18n();
  const put = (i: number, k: 0 | 1, x: string) => set(rows.map((r, j) => (j === i ? (k ? [r[0]!, x] : [x, r[1]!]) : r)));
  return (
    <div className="col g8">
      {rows.map((r, i) => (
        <div key={i} className={`pf-pair${narrow ? ' is-narrow' : ''}`}>
          <input className="input" aria-label={labels[0]} placeholder={labels[0]} value={r[0]} onChange={(e) => put(i, 0, e.target.value)} />
          {narrow
            ? <input className="input" aria-label={labels[1]} placeholder={labels[1]} value={r[1]} onChange={(e) => put(i, 1, e.target.value)} />
            : <textarea className="input pf-area" rows={2} aria-label={labels[1]} placeholder={labels[1]} value={r[1]} onChange={(e) => put(i, 1, e.target.value)} />}
          <button type="button" className="btn btn-ghost btn-sm" aria-label={t('pf.remove')} onClick={() => set(rows.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <AddBtn label={t('pf.add')} onClick={() => set([...rows, ['', '']])} />
    </div>
  );
}
