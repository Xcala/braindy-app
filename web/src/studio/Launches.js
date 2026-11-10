import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../lib/api';
import { useBrandsMaybe } from '../brands/BrandProvider';
import { LaunchModal } from './LaunchModal';
import { cityCode } from '../brands/cities';
/** Reactions a client can leave on a launch, like on social media. Everyone sees the counts. Same list as the API. */
const REACTIONS = [['fire', '🔥'], ['love', '😍'], ['clap', '👏'], ['idea', '💡']];
export const fetchLaunches = () => api('/v1/launches').then((r) => r.items);
const fetchOwn = (brandId) => api(`/v1/brands/${brandId}/launches/own`).then((r) => r.items);
export const setLaunch = (brandId, requestId, versionId, on, title = '') => api(`/v1/admin/brands/${brandId}/requests/${requestId}/versions/${versionId}/launch`, { method: 'POST', body: JSON.stringify({ on, title }) });
const react = (id, reaction, on) => api(`/v1/launches/${id}/reaction`, { method: 'POST', body: JSON.stringify({ reaction, on }) });
const SECONDS_PER_ITEM = 6;
/** The loop repeats short lists so the band is always full before it wraps around. */
const MIN_RUN = 8;
/**
 * Under the studio: an endless marquee of what was just launched, newest first. With a brand open, only that brand's
 * own finished work; without one, the community's launches (chosen by NickMark), tagged "Brainders community". Tapping an item opens it big (community ones with reactions). Titled "Latest launches"; each piece carries its brand's city (BOG, NYC). Hidden while empty.
 */
export function Launches() {
    const { t, lang } = useI18n();
    const brand = useBrandsMaybe()?.current ?? null;
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(null);
    useEffect(() => {
        let live = true;
        // With a brand open only its own work shows (Nicolas, 2026-11-10); the community's launches only without a brand.
        Promise.all([brand ? fetchOwn(brand.id).catch(() => []) : Promise.resolve([]), brand ? Promise.resolve([]) : fetchLaunches().catch(() => [])]).then(([o, l]) => {
            if (!live)
                return;
            const own = o.map((w) => ({ ...w, city: brand?.city ?? null, community: false }));
            const others = l.filter((x) => x.brandId !== brand?.id).map((x) => ({ ...x, community: true }));
            setItems([...own, ...others].sort((a, b) => (b.at ?? 0) - (a.at ?? 0)));
        });
        return () => { live = false; };
    }, [brand?.id]);
    const date = (ms) => (ms ? new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }).format(ms) : '');
    const subOf = (w) => `${w.brandName ?? brand?.name ?? ''}${w.at ? ` · ${date(w.at)}` : ''}`;
    // Optimistic: the count moves at once and goes back if the API refuses.
    function toggle(l, r) {
        const on = !l.mine.includes(r);
        const apply = (yes) => setItems((all) => all.map((x) => (x.id !== l.id || !x.community ? x : {
            ...x, mine: yes ? [...x.mine, r] : x.mine.filter((m) => m !== r), counts: { ...x.counts, [r]: Math.max(0, (x.counts?.[r] ?? 0) + (yes ? 1 : -1)) },
        })));
        apply(on);
        react(l.id, r, on).catch(() => apply(!on));
    }
    if (!items.length)
        return null;
    const run = Array.from({ length: Math.ceil(MIN_RUN / items.length) }, () => items).flat();
    const key = (w) => `${w.community ? 'c' : 'o'}-${w.id}`;
    const item = (w, i, copy) => (_jsx("li", { "aria-hidden": copy || undefined, children: _jsxs("button", { type: "button", className: "sd-ticker-item", tabIndex: copy ? -1 : undefined, onClick: () => setOpen(key(w)), children: [_jsxs("span", { className: "sd-thumb", children: [w.kind === 'video' ? _jsx("video", { src: w.url, muted: true, playsInline: true, preload: "metadata", "aria-hidden": "true" }) : _jsx("img", { src: w.url, alt: "", decoding: "async", fetchPriority: "low" }), cityCode(w.city) && _jsx("i", { className: "sd-city", children: cityCode(w.city) })] }), _jsxs("span", { className: "col min-w-0", children: [w.community && _jsx("span", { className: "sd-community", children: t('st.community') }), _jsx("b", { className: "t-sm truncate", children: w.title }), _jsx("span", { className: "t-xs t-mute truncate", children: subOf(w) })] })] }) }, `${i}-${key(w)}`));
    const current = items.find((w) => key(w) === open);
    return (_jsxs("section", { className: "sd-launches", "aria-labelledby": "h-launches", children: [_jsx("h2", { className: "sd-launches-title", id: "h-launches", children: t('st.latest') }), _jsx("div", { className: "sd-ticker", children: _jsxs("ul", { className: "sd-ticker-run", style: { ['--crawl']: `${run.length * SECONDS_PER_ITEM}s` }, children: [run.map((w, i) => item(w, i, i >= items.length)), run.map((w, i) => item(w, run.length + i, true))] }) }), current && (_jsx(LaunchModal, { w: current, sub: subOf(current), onClose: () => setOpen(null), children: current.community && current.counts && (_jsx("div", { className: "row g6 wrap", role: "group", "aria-label": t('st.react'), children: REACTIONS.map(([r, emoji]) => {
                        const on = current.mine.includes(r), n = current.counts?.[r] ?? 0;
                        return (_jsxs("button", { type: "button", className: `sd-react ${on ? 'on' : ''}`, "aria-pressed": on, "aria-label": t(`st.react.${r}`), onClick: () => toggle(current, r), children: [_jsx("span", { "aria-hidden": "true", children: emoji }), n > 0 && _jsx("span", { className: "t-xs", children: n })] }, r));
                    }) })) }))] }));
}
