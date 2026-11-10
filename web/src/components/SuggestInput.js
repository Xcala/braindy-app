import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from './Icon';
/** A text field whose placeholder is a ready-to-use suggestion: right arrow on a keyboard, or the arrow button, accepts it (like Claude's prompt box). */
export function SuggestInput({ value, onChange, suggestion, className = '', disabled, ...rest }) {
    const { t } = useI18n();
    const canAccept = !value && !!suggestion && !disabled;
    return (_jsxs("div", { className: "suggest-input", children: [_jsx("input", { ...rest, className: `input ${className}`, value: value, disabled: disabled, placeholder: suggestion, onChange: (e) => onChange(e.target.value), onKeyDown: (e) => {
                    if (e.key === 'ArrowRight' && canAccept) {
                        e.preventDefault();
                        onChange(suggestion);
                    }
                    rest.onKeyDown?.(e);
                } }), canAccept && (_jsx("button", { type: "button", className: "suggest-accept", "aria-label": t('common.useSuggestion'), title: `${t('common.useSuggestion')} (→)`, onClick: () => onChange(suggestion), children: _jsx(Icon, { name: "arrowRight", size: 16 }) }))] }));
}
