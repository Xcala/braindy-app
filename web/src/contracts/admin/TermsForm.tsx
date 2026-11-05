import { useI18n } from '../../i18n/I18nProvider';
import type { StringKey } from '../../i18n/strings';
import { TERM_GROUPS } from '../types';

const LONG = new Set(['objeto', 'terceros.incluidos']);

/** The contract terms, grouped, minus the ones the main form already asks (hide). Labels say what each value means. */
export function TermsForm({ terms, onChange, missing, hide = [] }: { terms: Record<string, string>; onChange: (t: Record<string, string>) => void; missing: string[]; hide?: string[] }) {
  const { t } = useI18n();
  return (
    <div className="col g16">
      {TERM_GROUPS.map((g) => (
        <fieldset key={g.title} className="col g8" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ marginBottom: 6 }}>{t(`ctr.tg.${g.title}` as StringKey)}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {g.keys.filter((k) => !hide.includes(k)).map((k) => (
              <label key={k} className={`col g4 t-sm ${LONG.has(k) ? 'sm:col-span-2' : ''}`}>
                <span className="w7">{t(`ctr.t.${k}` as StringKey)}</span>
                {k === 'valor.moneda'
                  ? <select className="input" value={terms[k] ?? 'COP'} onChange={(e) => onChange({ ...terms, [k]: e.target.value })}><option>COP</option><option>USD</option></select>
                  : LONG.has(k)
                    ? <textarea className="input" rows={2} value={terms[k] ?? ''} onChange={(e) => onChange({ ...terms, [k]: e.target.value })} />
                    : <input className="input" value={terms[k] ?? ''} onChange={(e) => onChange({ ...terms, [k]: e.target.value })} aria-invalid={missing.includes(k) || undefined} style={missing.includes(k) ? { borderColor: 'var(--danger)' } : undefined} />}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
