import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { applyUpdate, usePwa } from './pwa';
import './pwa.css';
/** Two quiet notices above everything: no connection, and a new version ready to load. */
export function PwaBar() {
    const { t } = useI18n();
    const { offline, update } = usePwa();
    if (!offline && !update)
        return null;
    return (_jsx("div", { className: "pwa-bar", role: "status", "aria-live": "polite", children: offline ? (_jsxs("span", { className: "pwa-pill is-off", children: [_jsx("i", { "aria-hidden": "true" }), t('pwa.offline')] })) : (_jsxs("span", { className: "pwa-pill", children: [t('pwa.update'), _jsx("button", { type: "button", onClick: applyUpdate, children: t('pwa.reload') })] })) }));
}
/** iPhone and iPad have no install button: the two taps that add Braindy to the home screen. */
export function IosSteps() {
    const { t } = useI18n();
    const share = _jsx("svg", { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" }) });
    return (_jsxs("ol", { className: "pwa-steps", children: [_jsxs("li", { children: [_jsx("span", { className: "pwa-n", children: "1" }), _jsxs("span", { children: [t('pwa.ios1'), " ", _jsx("b", { className: "pwa-ico", children: share })] })] }), _jsxs("li", { children: [_jsx("span", { className: "pwa-n", children: "2" }), _jsx("span", { children: t('pwa.ios2') })] })] }));
}
