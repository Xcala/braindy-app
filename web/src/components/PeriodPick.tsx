/** Small segmented buttons for a period or any short choice (FOR-1, L10): every option visible, one tap to change. */
export function PeriodPick<V extends string | number>({ options, value, onChange, label, className = '' }: {
  options: ReadonlyArray<{ value: V; label: string }>;
  value: V;
  onChange: (v: V) => void;
  /** Read by screen readers (e.g. «Periodo»). */
  label: string;
  className?: string;
}) {
  return (
    <div className={`seg ${className}`.trim()} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" className={o.value === value ? 'is-on' : ''} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
