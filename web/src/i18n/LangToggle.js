import { jsx as _jsx } from "react/jsx-runtime";
import { useI18n } from './I18nProvider';
export function LangToggle() {
    const { lang, setLang } = useI18n();
    return (_jsx("div", { className: "lang", role: "group", "aria-label": "Language", children: ['en', 'es'].map((l) => (_jsx("button", { onClick: () => setLang(l), "aria-pressed": lang === l, className: lang === l ? 'is-on' : '', children: l.toUpperCase() }, l))) }));
}
