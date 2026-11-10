import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
const svg = (d) => _jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: d });
/** One line icon per page, shared by the sidebar (desktop) and the bottom bar (phones). */
export const NAV_ICON = {
    '/home': svg(_jsxs(_Fragment, { children: [_jsx("path", { d: "M3 11 12 4l9 7" }), _jsx("path", { d: "M5 10v10h14V10" })] })),
    '/brand': svg(_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("circle", { cx: "8.5", cy: "10", r: "1.3" }), _jsx("circle", { cx: "12", cy: "7.5", r: "1.3" }), _jsx("circle", { cx: "15.5", cy: "10", r: "1.3" }), _jsx("path", { d: "M12 21c-1.5 0-2-1-2-2s1-2 2-2" })] })),
    '/requests': svg(_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M12 8v8M8 12h8" })] })),
    '/assets': svg(_jsx("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" })),
    '/report': svg(_jsx("path", { d: "M4 20V10M10 20V4M16 20v-7M20 20H3" })),
    '/learn': svg(_jsxs(_Fragment, { children: [_jsx("path", { d: "M2 8l10-5 10 5-10 5z" }), _jsx("path", { d: "M6 10v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" })] })),
    '/accesses': svg(_jsxs(_Fragment, { children: [_jsx("rect", { x: "4", y: "10", width: "16", height: "11", rx: "2" }), _jsx("path", { d: "M8 10V7a4 4 0 0 1 8 0v3" })] })),
    '/plan': svg(_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2" }), _jsx("path", { d: "M3 10h18" })] })),
    '/settings': svg(_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" })] })),
    // Admin space.
    '/admin/today': svg(_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M12 7v5l3 2" })] })),
    '/admin/studio': svg(_jsxs(_Fragment, { children: [_jsx("path", { d: "M3 21h18" }), _jsx("path", { d: "M5 21V8l7-5 7 5v13" }), _jsx("path", { d: "M10 21v-6h4v6" })] })),
    '/admin/brands': svg(_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1.5" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1.5" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1.5" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1.5" })] })),
    '/admin/proposals': svg(_jsxs(_Fragment, { children: [_jsx("path", { d: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" }), _jsx("path", { d: "M14 3v6h6M8 13h8M8 17h5" })] })),
    '/admin/onboarding': svg(_jsx(_Fragment, { children: _jsx("path", { d: "M5 12l4 4L19 6" }) })),
    '/admin/billing': svg(_jsx(_Fragment, { children: _jsx("path", { d: "M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }) })),
    '/admin/ai': svg(_jsx(_Fragment, { children: _jsx("path", { d: "M3 12h4l2-5 4 10 2-5h6" }) })),
    '/admin/costs': svg(_jsxs(_Fragment, { children: [_jsx("path", { d: "M3 3v18h18" }), _jsx("path", { d: "M7 15l4-4 3 3 5-6" })] })),
    '/team': svg(_jsxs(_Fragment, { children: [_jsx("circle", { cx: "9", cy: "8", r: "3.5" }), _jsx("path", { d: "M2.5 20a6.5 6.5 0 0 1 13 0" }), _jsx("path", { d: "M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" })] })),
    '/admin/whatsapp': svg(_jsxs(_Fragment, { children: [_jsx("path", { d: "M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z" }), _jsx("path", { d: "M9 9.5c.3 2.2 2.3 4.2 4.5 4.5l1.2-1.2 2 .8v1.4c-3.9.6-8.6-4.1-8-8h1.4l.8 2z" })] })),
    '/admin/criterio': svg(_jsxs(_Fragment, { children: [_jsx("path", { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" }), _jsx("path", { d: "M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" })] })),
    collapse: svg(_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }), _jsx("path", { d: "M9 4v16M15 10l-2 2 2 2" })] })),
    expand: svg(_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }), _jsx("path", { d: "M9 4v16M13 10l2 2-2 2" })] })),
};
// My brand opens on Visual.
NAV_ICON['/brand/visual'] = NAV_ICON['/brand'];
// Phones: «More» opens every page.
NAV_ICON.more = svg(_jsxs(_Fragment, { children: [_jsx("circle", { cx: "5", cy: "12", r: "1.6" }), _jsx("circle", { cx: "12", cy: "12", r: "1.6" }), _jsx("circle", { cx: "19", cy: "12", r: "1.6" })] }));
// The pages inside a tab, for the «More» list.
NAV_ICON['/brand/brain'] = svg(_jsxs(_Fragment, { children: [_jsx("path", { d: "M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 0V7a3 3 0 0 0-3-3z" }), _jsx("path", { d: "M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 0" })] }));
NAV_ICON['/research'] = svg(_jsxs(_Fragment, { children: [_jsx("circle", { cx: "11", cy: "11", r: "7" }), _jsx("path", { d: "m20 20-4-4" })] }));
NAV_ICON['/apps'] = svg(_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1.5" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1.5" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1.5" }), _jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1.5" })] }));
NAV_ICON['/calendar'] = svg(_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "5", width: "18", height: "16", rx: "2" }), _jsx("path", { d: "M3 10h18M8 3v4M16 3v4" })] }));
