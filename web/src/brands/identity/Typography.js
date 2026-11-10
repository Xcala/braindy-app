import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Scan } from '../../components/Scan';
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
/** Every font gets a download link: its own file or link, else Google Fonts, Adobe Fonts or a search for it. */
export function fontLink(f) {
    const own = f.downloadUrl || f.url;
    const family = (f.fontFamily ?? f.name ?? '').trim();
    const type = (f.type ?? '').toLowerCase();
    if (own)
        return { href: own, label: type.includes('adobe') && own.includes('adobe') ? 'brand.fontAdobe' : 'brand.fontDownload' };
    if (type === 'google')
        return { href: `https://fonts.google.com/specimen/${family.replace(/\s+/g, '+')}`, label: 'brand.fontDownload' };
    if (type.includes('adobe'))
        return { href: `https://fonts.adobe.com/fonts/${family.toLowerCase().replace(/\s+/g, '-')}`, label: 'brand.fontAdobe' };
    return { href: `https://www.google.com/search?q=${encodeURIComponent(`${family} font download`)}`, label: 'brand.fontFind' };
}
export function Typography({ fonts }) {
    const { t } = useI18n();
    useGoogleFonts([...new Set(fonts.filter((f) => f.type === 'google' && f.fontFamily).map((f) => f.fontFamily))]);
    if (!fonts.length)
        return null;
    return (_jsx("div", { className: "grid gap-5 md:grid-cols-2 lg:grid-cols-3", children: fonts.map((f) => {
            const link = fontLink(f);
            return (_jsxs("div", { className: "card col g20", children: [_jsxs("div", { className: "row between g8", children: [_jsx("p", { className: "label", children: f.role ?? '' }), f.type && _jsx("span", { className: "chip c-type", children: f.type === 'google' ? 'Google Fonts' : f.type.toLowerCase().includes('adobe') ? 'Adobe Fonts' : f.type })] }), _jsx("p", { className: "text-5xl sm:text-[64px] sm:leading-[64px]", style: { fontFamily: f.fontFamily, color: 'var(--ink)' }, children: "Aa" }), _jsxs("div", { className: "col g4", children: [_jsx("span", { className: "h3", style: { fontFamily: f.fontFamily }, children: f.name ?? f.fontFamily }), f.description && _jsx(Scan, { text: f.description, points: true })] }), _jsxs("a", { href: link.href, target: "_blank", rel: "noreferrer", className: "btn btn-secondary btn-sm self-start", style: { textDecoration: 'none' }, children: ["\u2193 ", t(link.label)] })] }, f.id ?? f.name ?? f.fontFamily));
        }) }));
}
