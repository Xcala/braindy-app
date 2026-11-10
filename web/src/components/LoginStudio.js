import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Scene } from '../studio/Scene';
import { buildSeats } from '../studio/useStudio';
/** The sign-in stage shows the real live studio: San Francisco hours and light, today's outfit, wall clocks, zoom into each seat. */
export function LoginStudio() {
    const { t } = useI18n();
    const seats = useMemo(() => buildSeats([], [], []), []);
    return (_jsxs("div", { className: "sd-wrap relative", style: { borderRadius: 16, overflow: 'hidden', boxShadow: '0 18px 50px #0007', border: '1px solid #ffffff1f' }, children: [_jsx(Scene, { seats: seats, items: [], toSignCount: 0, brandView: true, compact: true }), _jsxs("span", { className: "sd-live pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-bold text-white", style: { background: '#0B1022CC', backdropFilter: 'blur(8px)' }, children: [_jsx("i", { className: "live-dot", "aria-hidden": "true" }), t('login.studioLive')] })] }));
}
