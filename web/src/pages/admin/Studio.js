import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { Scene } from '../../studio/Scene';
import { Launches } from '../../studio/Launches';
import { SEATS } from '../../studio/geometry';
import { SEAT_NAME } from '../../studio/FocusCard';
import { useStudio } from '../../studio/useStudio';
const time = (ms) => new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ms));
/** Admin · The Studio: NickMark and his Brains working in San Francisco, connected to the real requests. */
export function AdminStudio() {
    const { t } = useI18n();
    const { brands } = useBrands();
    const { seats, feed, items, toSignCount } = useStudio();
    const brand = (id) => brands.find((b) => b.id === id)?.name ?? '';
    return (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: "Braindy \u00B7 San Francisco, California" }), _jsx("h1", { className: "h1", children: _jsxs("span", { className: "w9", children: [t('st.title'), "."] }) }), _jsx("p", { className: "t-mute", children: t('st.sub') })] }), _jsxs("div", { className: "sd-with-launches", children: [_jsx(Scene, { seats: seats, items: items, toSignCount: toSignCount }), _jsx(Launches, {})] }), _jsxs("section", { className: "card col g12", "aria-labelledby": "h-live", children: [_jsx("h2", { className: "h3", id: "h-live", children: t('st.live') }), feed.length === 0 && _jsx("p", { className: "t-sm t-mute", children: t('st.feedEmpty') }), feed.map((e) => (_jsxs("div", { className: "row g12 t-sm", style: { alignItems: 'flex-start' }, children: [_jsx("i", { style: { width: 8, height: 8, borderRadius: '50%', marginTop: 6, flex: 'none', background: SEATS[e.brain]?.c ?? '#888', border: '1px solid var(--line)' } }), _jsxs("div", { className: "col min-w-0", children: [_jsxs("span", { children: [_jsx("b", { children: SEAT_NAME[e.brain] ?? e.brain }), " \u00B7 ", e.kind === 'note' ? `NicoMarca: ${e.text}` : e.text] }), _jsxs("span", { className: "t-xs t-mute", children: [brand(e.brandId), e.brandId ? ' · ' : '', e.at ? `${time(e.at)} SF` : ''] })] })] }, e.id)))] })] }));
}
