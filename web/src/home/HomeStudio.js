import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { Scene } from '../studio/Scene';
import { Launches } from '../studio/Launches';
import { buildSeats } from '../studio/useStudio';
/** The studio on the home (the hero), with the launches beside it: the team working, live, only on this brand's open requests (read-only for clients). */
export function HomeStudio({ requests }) {
    const { current } = useBrands();
    const items = useMemo(() => requests.filter((r) => r.status === 'in_production' || r.status === 'to_approve'), [requests]);
    const seats = useMemo(() => buildSeats(items, [], []), [items]);
    return (_jsxs("div", { className: "sd-with-launches", children: [_jsx(Scene, { seats: seats, items: items, toSignCount: 0, brandView: true, city: current?.city, brandName: current?.name }), _jsx(Launches, {})] }));
}
