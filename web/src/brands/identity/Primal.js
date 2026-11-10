import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../../i18n/I18nProvider';
import { Scan } from '../../components/Scan';
/** The seven pieces of Primal Branding (Patrick Hanlon): what turns a brand into something people believe in. */
export const PRIMAL_KEYS = ['creationStory', 'creed', 'icons', 'rituals', 'sacredWords', 'nonBelievers', 'leader'];
export const hasPrimal = (p) => !!p && PRIMAL_KEYS.some((k) => (p[k] ?? '').trim());
/** Always first in Essence. Empty, it says NickMark is building it, so the client knows it is coming. */
export function Primal({ primal }) {
    const { t } = useI18n();
    if (!hasPrimal(primal)) {
        return (_jsxs("div", { className: "card col g8", style: { borderStyle: 'dashed' }, children: [_jsx("p", { className: "w7", style: { margin: 0 }, children: t('primal.emptyTitle') }), _jsx("p", { className: "t-sm t-mute", style: { margin: 0 }, children: t('primal.empty') })] }));
    }
    const pieces = PRIMAL_KEYS.filter((k) => (primal[k] ?? '').trim());
    return (_jsx("div", { className: "grid gap-5 md:grid-cols-2 xl:grid-cols-3", children: pieces.map((k) => (_jsxs("div", { className: `card col g12${k === 'creed' ? ' md:col-span-2 xl:col-span-1' : ''}`, children: [_jsxs("span", { className: "row g8", children: [_jsx("span", { className: "label", style: { color: 'var(--azul)' }, children: String(PRIMAL_KEYS.indexOf(k) + 1).padStart(2, '0') }), _jsx("span", { className: "label", children: t(`primal.${k}`) })] }), _jsx("p", { className: "t-xs t-mute", style: { margin: 0 }, children: t(`primal.${k}Hint`) }), _jsx(Scan, { text: primal[k], points: true, tone: "ink", className: "" })] }, k))) }));
}
