import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
/** Loads Google Fonts used by the brand so the specimen renders in the real typeface. */
function useGoogleFonts(families) {
    const key = families.join('|');
    useEffect(() => {
        if (!key)
            return;
        const href = `https://fonts.googleapis.com/css2?${key.split('|').map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`).join('&')}&display=swap`;
        if (document.querySelector(`link[href="${href}"]`))
            return;
        const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href });
        document.head.appendChild(link);
    }, [key]);
}
export function Typography({ fonts }) {
    useGoogleFonts([...new Set(fonts.filter((f) => f.type === 'google' && f.fontFamily).map((f) => f.fontFamily))]);
    if (!fonts.length)
        return null;
    return (_jsx("div", { className: "grid gap-5 md:grid-cols-2 lg:grid-cols-3", children: fonts.map((f) => {
            const link = f.downloadUrl || f.url;
            return (_jsxs("div", { className: "card col g20", children: [_jsxs("div", { className: "row between g8", children: [_jsx("p", { className: "label", children: f.role ?? '' }), f.type && _jsx("span", { className: "chip c-type", children: f.type === 'google' ? 'Google Fonts' : f.type })] }), _jsx("p", { style: { fontFamily: f.fontFamily, fontSize: 64, lineHeight: '64px', color: 'var(--ink)' }, children: "Aa" }), _jsxs("div", { className: "col g4", children: [_jsx("span", { className: "h3", style: { fontFamily: f.fontFamily }, children: f.name ?? f.fontFamily }), f.description && _jsx("p", { className: "t-sm t-mute", children: f.description })] }), link && _jsxs("a", { href: link, target: "_blank", rel: "noreferrer", className: "t-sm w7", children: [f.fontFamily ?? f.name, " \u2197"] })] }, f.id ?? f.name));
        }) }));
}
