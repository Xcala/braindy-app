import type { InputHTMLAttributes } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from './Icon';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'placeholder'> & {
  value: string;
  onChange: (v: string) => void;
  /** Shown greyed while the field is empty; → (or the arrow button on phones) types it in. */
  suggestion: string;
};

/** A text field whose placeholder is a ready-to-use suggestion: right arrow on a keyboard, or the arrow button, accepts it (like Claude's prompt box). */
export function SuggestInput({ value, onChange, suggestion, className = '', disabled, ...rest }: Props) {
  const { t } = useI18n();
  const canAccept = !value && !!suggestion && !disabled;
  return (
    <div className="suggest-input">
      <input
        {...rest}
        className={`input ${className}`}
        value={value}
        disabled={disabled}
        placeholder={suggestion}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' && canAccept) { e.preventDefault(); onChange(suggestion); }
          rest.onKeyDown?.(e);
        }}
      />
      {canAccept && (
        <button type="button" className="suggest-accept" aria-label={t('common.useSuggestion')} title={`${t('common.useSuggestion')} (→)`} onClick={() => onChange(suggestion)}>
          <Icon name="arrowRight" size={16} />
        </button>
      )}
    </div>
  );
}
