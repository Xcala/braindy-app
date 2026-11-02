import type { ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';

/** Small building blocks for the admin plan forms: a labelled field, text, number, date, chips and one-per-line lists. */
export function F({ label, wide, group, children }: { label: string; wide?: boolean; group?: boolean; children: ReactNode }) {
  const cls = `pf-f${wide ? ' is-wide' : ''}`;
  // Groups of buttons are not wrapped in a label: a click on the label text would press the first one.
  return group ? <div className={cls} role="group" aria-label={label}><span>{label}</span>{children}</div> : <label className={cls}><span>{label}</span>{children}</label>;
}

export function Txt({ value, set, ph }: { value?: string; set: (v: string) => void; ph?: string }) {
  return <input className="input" value={value ?? ''} placeholder={ph} onChange={(e) => set(e.target.value)} />;
}

export function Area({ value, set, rows = 2 }: { value?: string; set: (v: string) => void; rows?: number }) {
  return <textarea className="input pf-area" rows={rows} value={value ?? ''} onChange={(e) => set(e.target.value)} />;
}

/** Whole numbers shown with thousands separators (prices in COP run long). */
export function Num({ value, set }: { value?: number; set: (v: number | undefined) => void }) {
  const { lang } = useI18n();
  return (
    <input className="input" inputMode="numeric" value={value == null ? '' : value.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US')}
      onChange={(e) => { const d = e.target.value.replace(/\D/g, ''); set(d ? Number(d) : undefined); }} />
  );
}

export function DateF({ value, set }: { value?: string; set: (v: string | undefined) => void }) {
  return <input className="input" type="date" value={value ?? ''} onChange={(e) => set(e.target.value || undefined)} />;
}

export function Chips<T extends string>({ value, set, options }: { value?: T; set: (v: T) => void; options: Array<[T, string]> }) {
  return (
    <div className="seg seg-scroll" role="group">
      {options.map(([v, l]) => <button key={v} type="button" className={value === v ? 'is-on' : ''} aria-pressed={value === v} onClick={() => set(v)}>{l}</button>)}
    </div>
  );
}

/** A list of short texts, one per line. Empty lines are kept while typing and dropped on save. */
export function Lines({ value, set }: { value: string[]; set: (v: string[]) => void }) {
  return <textarea className="input pf-area" rows={Math.max(3, value.length + 1)} value={value.join('\n')} onChange={(e) => set(e.target.value.split('\n'))} />;
}

export function Item({ title, onRemove, children }: { title: string; onRemove: () => void; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="pf-item">
      <div className="pf-ihead"><b>{title}</b><button type="button" className="btn btn-ghost btn-sm" onClick={onRemove}>{t('pf.remove')}</button></div>
      {children}
    </div>
  );
}

export function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" className="btn btn-secondary btn-sm pf-add" onClick={onClick}>+ {label}</button>;
}

export function Sec({ title, children }: { title: string; children: ReactNode }) {
  return <fieldset className="pf-sec"><legend>{title}</legend>{children}</fieldset>;
}

/** Drops empty lines and blank optional texts before saving. */
export function tidy<T>(v: T): T {
  if (Array.isArray(v)) return v.filter((x) => !(typeof x === 'string' && !x.trim())).map(tidy) as T;
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).filter(([, x]) => x !== '' && x !== undefined).map(([k, x]) => [k, tidy(x)])) as T;
  return (typeof v === 'string' ? v.trim() : v) as T;
}
