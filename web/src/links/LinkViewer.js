import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../lib/api';
import { SitePanel } from './SitePanel';
import { useSpot } from './useSpot';
import { AddressBar } from './AddressBar';
import './viewer.css';
const SIZES = { desktop: '100%', tablet: '820px', phone: '390px' };
/**
 * A site or app opened inside Braindy, full screen, with a computer / tablet / phone width and a way out to a new tab.
 * Sites that refuse to be shown inside another page (checked when NickMark saves the link) get the new-tab button instead.
 */
export function LinkViewer({ brandId, link, links, onClose }) {
    const { t } = useI18n();
    const [size, setSize] = useState('desktop');
    const close = useRef(null);
    useEffect(() => {
        const prev = document.activeElement;
        close.current?.focus();
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        // The page behind does not scroll while the viewer is open.
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus(); };
    }, [onClose]);
    // Links saved before the check ask the API once (it keeps the answer on the link). undefined = still asking.
    const [frame, setFrame] = useState(typeof link.embeddable === 'boolean' ? link.embeddable : undefined);
    useEffect(() => {
        if (frame !== undefined)
            return;
        api(`/v1/brands/${brandId}/links/${link.id}/frame`).then((r) => setFrame(r.embeddable), () => setFrame(null));
    }, [brandId, link.id, frame]);
    const blocked = frame === false;
    const spot = useSpot(link.url);
    // The adjustments column: open by default where there is room, folded on phones.
    const hasPanel = link.section === 'apps';
    const [panel, setPanel] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768);
    return (_jsxs("div", { className: "lview", role: "dialog", "aria-modal": "true", "aria-label": link.title, children: [_jsxs("div", { className: "lview-bar", children: [_jsxs("button", { type: "button", className: "lview-back", onClick: onClose, "aria-label": t('lv.backTo'), title: t('lv.backTo'), children: [_jsx("svg", { viewBox: "0 0 24 24", width: "18", height: "18", "aria-hidden": "true", children: _jsx("path", { d: "M19 12H5M11 6l-6 6 6 6", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }), _jsx("span", { children: t('lv.back') })] }), _jsxs("div", { className: "col", style: { minWidth: 0 }, children: [_jsx("span", { className: "w7 truncate", children: link.title }), blocked && _jsx("span", { className: "t-xs t-mute truncate", children: link.url.replace(/^https:\/\//, '') })] }), !blocked && _jsx(AddressBar, { spot: spot, home: link.url }), !blocked && (_jsx("div", { className: "seg lview-sizes", role: "group", "aria-label": t('lv.size'), children: Object.keys(SIZES).map((s) => (_jsx("button", { type: "button", className: size === s ? 'is-on' : '', "aria-pressed": size === s, onClick: () => setSize(s), children: t(`lv.${s}`) }, s))) })), _jsxs("a", { href: link.url, target: "_blank", rel: "noreferrer", className: "btn btn-secondary btn-sm", children: [t('lv.newTab'), " \u2197"] }), _jsx("button", { ref: close, type: "button", className: "btn btn-ghost btn-sm", onClick: onClose, "aria-label": t('lb.close'), children: "\u2715" })] }), _jsxs("div", { className: "lview-body", children: [_jsx("div", { className: "lview-stage", children: frame === undefined ? _jsx("div", { className: "skel lview-frame", style: { width: SIZES[size] } }) : blocked ? (_jsxs("div", { className: "card col g12 lview-blocked", children: [_jsx("p", { className: "h3", style: { margin: 0 }, children: t('lv.blockedTitle') }), _jsx("p", { className: "t-sm t-mute", style: { margin: 0 }, children: t('lv.blocked') }), _jsxs("a", { href: link.url, target: "_blank", rel: "noreferrer", className: "btn btn-primary self-start", children: [t('lv.newTab'), " \u2197"] })] })) : (_jsxs(_Fragment, { children: [_jsx("iframe", { ref: spot.frame, title: link.title, src: link.url, className: "lview-frame", style: { width: SIZES[size] }, sandbox: "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads", referrerPolicy: "no-referrer", allow: "fullscreen; clipboard-write" }), frame === null && _jsx("p", { className: "t-xs t-mute lview-hint", children: t('lv.hint') }), spot.note && _jsxs("p", { className: "lview-note t-sm", role: "status", children: [t(spot.note === 'moved' ? 'sp.noBridge' : spot.note === 'nobridge' ? 'sc.noBridge' : 'sp.notFound'), " ", _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: spot.dismiss, "aria-label": t('lb.close'), children: "\u2715" })] })] })) }), hasPanel && (_jsxs("div", { className: `lview-side${panel ? ' is-open' : ''}`, children: [_jsxs("button", { type: "button", className: "lview-side-tog", "aria-expanded": panel, "aria-controls": "site-panel", onClick: () => setPanel((p) => !p), "aria-label": t(panel ? 'sp.hide' : 'sp.show'), title: t(panel ? 'sp.hide' : 'sp.show'), children: [_jsx("svg", { viewBox: "0 0 24 24", width: "18", height: "18", "aria-hidden": "true", children: _jsx("path", { d: "M13 6l6 6-6 6M5 6l6 6-6 6", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }), _jsx("span", { className: "lview-side-label", children: t('sp.toggle') })] }), _jsx("div", { className: "lview-side-in", inert: !panel, children: _jsx(SitePanel, { brandId: brandId, link: link, links: links, frame: blocked ? undefined : spot }) })] }))] })] }));
}
