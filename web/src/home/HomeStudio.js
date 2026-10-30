import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';
import { Scene } from '../studio/Scene';
import { buildSeats } from '../studio/useStudio';
/** The studio on the home: the team working, live, only on this brand's open requests (read-only for clients). */
export function HomeStudio({ requests }) {
    const { t } = useI18n();
    const { current } = useBrands();
    const items = useMemo(() => requests.filter((r) => r.status === 'in_production' || r.status === 'to_approve'), [requests]);
    const seats = useMemo(() => buildSeats(items, [], []), [items]);
    return (_jsxs("section", { className: "col g12", "aria-labelledby": "h-studio", children: [_jsxs("div", { className: "col g4", children: [_jsx("h2", { className: "h3", id: "h-studio", children: t('st.homeTitle') }), _jsx("p", { className: "t-sm t-mute", children: t('st.homeSub') })] }), _jsx(Scene, { seats: seats, items: items, toSignCount: 0, brandView: true, city: current?.city })] }));
}
