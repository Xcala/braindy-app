import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
export function Placeholder({ title, phase }) {
    const { t } = useI18n();
    return (_jsxs("section", { children: [_jsx("h1", { className: "text-3xl font-black tracking-tight", children: t(title) }), _jsx("p", { className: "mt-2 text-black/55", children: t('common.comingPhase', { n: phase }) })] }));
}
