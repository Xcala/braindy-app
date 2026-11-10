import { jsx as _jsx } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from './useTheme';
/** Light · Dark · System, same pill as the language switch. */
export function ThemeToggle() {
    const { t } = useI18n();
    const { pref, set } = useTheme();
    return (_jsx("div", { className: "lang", role: "group", "aria-label": t('theme.title'), children: ['light', 'dark', 'system'].map((p) => (_jsx("button", { onClick: () => set(p), "aria-pressed": pref === p, className: pref === p ? 'is-on' : '', children: t(`theme.${p}`) }, p))) }));
}
