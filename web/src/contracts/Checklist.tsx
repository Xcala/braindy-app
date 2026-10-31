import { useI18n } from '../i18n/I18nProvider';
import type { ChecklistItem } from './types';
import { weekDate } from './text';

/** Kickoff checklist (Anexo 3): what the client hands over and by when (Friday of its week). Tickable when onToggle is set. */
export function Checklist({ items, start, onToggle }: { items: ChecklistItem[]; start: string; onToggle?: (id: string, done: boolean) => void }) {
  const { t, lang } = useI18n();
  const due = (w: number) => weekDate(start, w, 4).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const late = (it: ChecklistItem) => !it.done && weekDate(start, it.week, 5).getTime() < Date.now();
  return (
    <ul className="col" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((it) => (
        <li key={it.id} className="row between g12" style={{ padding: '10px 0', borderTop: '1px solid #EEF1F6' }}>
          <label className="row g12 min-w-0" style={{ cursor: onToggle ? 'pointer' : 'default' }}>
            {onToggle
              ? <input type="checkbox" checked={it.done} onChange={(e) => onToggle(it.id, e.target.checked)} />
              : <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 4, background: '#C9D0DE', flex: 'none' }} />}
            <span className={`t-sm ${it.done ? 't-mute' : ''}`} style={it.done ? { textDecoration: 'line-through' } : undefined}>{it.title}</span>
          </label>
          <span className="t-xs w7" style={{ flex: 'none', color: late(it) ? 'var(--danger)' : 'var(--mute, #6B7385)' }}>
            {it.done ? t('ctr.delivered') : late(it) ? t('ctr.lateSince', { date: due(it.week) }) : t('ctr.dueBy', { date: due(it.week) })}
          </span>
        </li>
      ))}
    </ul>
  );
}
