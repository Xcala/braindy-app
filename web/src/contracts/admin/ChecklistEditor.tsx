import { useI18n } from '../../i18n/I18nProvider';
import type { ChecklistItem } from '../types';

/** Anexo 3: what the client hands over and in which week (due on Friday of that week). */
export function ChecklistEditor({ items, weeks, onChange }: { items: ChecklistItem[]; weeks: number; onChange: (items: ChecklistItem[]) => void }) {
  const { t } = useI18n();
  const set = (i: number, p: Partial<ChecklistItem>) => onChange(items.map((x, k) => (k === i ? { ...x, ...p } : x)));
  return (
    <div className="col g8">
      {items.map((it, i) => (
        <div key={it.id} className="row g8">
          <input className="input" style={{ flex: 1 }} value={it.title} aria-label={t('ctr.k.item')} onChange={(e) => set(i, { title: e.target.value })} />
          <select className="input" style={{ width: '5.625rem' }} value={it.week} aria-label={t('ctr.k.week')} onChange={(e) => set(i, { week: Number(e.target.value) })}>
            {Array.from({ length: weeks }, (_, w) => <option key={w} value={w}>{t('ctr.weekShort', { n: w + 1 })}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" aria-label={t('ctr.g.removeRow')} onClick={() => onChange(items.filter((_, k) => k !== i))}>×</button>
        </div>
      ))}
      <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => onChange([...items, { id: `k${Date.now().toString(36)}`, title: '', week: 0, done: false }])}>{t('ctr.k.add')}</button>
    </div>
  );
}
