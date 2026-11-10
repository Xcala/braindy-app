import { jsx as _jsx } from "react/jsx-runtime";
const NET = {
    instagram: { label: 'Instagram', short: 'IG', color: '#D62976' },
    facebook: { label: 'Facebook', short: 'FB', color: '#1877F2' },
    linkedin: { label: 'LinkedIn', short: 'in', color: '#0A66C2' },
    youtube: { label: 'YouTube', short: 'YT', color: '#FF0000' },
    tiktok: { label: 'TikTok', short: 'TT', color: '#111111' },
    twitter: { label: 'X', short: 'X', color: '#111111' },
    threads: { label: 'Threads', short: '@', color: '#111111' },
    pinterest: { label: 'Pinterest', short: 'P', color: '#E60023' },
    bluesky: { label: 'Bluesky', short: 'B', color: '#1185FE' },
    gmb: { label: 'Google', short: 'G', color: '#4285F4' },
};
export const netInfo = (n) => NET[n] ?? { label: n, short: n.slice(0, 2).toUpperCase(), color: '#5C6375' };
/** A small round badge with the network's initials and color. */
export function NetBadge({ network }) {
    const n = netInfo(network);
    return _jsx("span", { className: "cal-net", style: { background: n.color }, title: n.label, "aria-label": n.label, children: n.short });
}
/** The post's first image or video frame, square. */
export function PostThumb({ post, className = '' }) {
    const m = post.media[0];
    if (post.thumb)
        return _jsx("img", { className: `cal-thumb ${className}`, src: post.thumb, alt: "", loading: "lazy" });
    if (!m)
        return _jsx("span", { className: `cal-thumb is-text ${className}`, "aria-hidden": "true", children: "Aa" });
    return m.kind === 'video'
        ? _jsx("video", { className: `cal-thumb ${className}`, src: `${m.url}#t=0.5`, preload: "metadata", muted: true, playsInline: true, "aria-hidden": "true" })
        : _jsx("img", { className: `cal-thumb ${className}`, src: m.url, alt: "", loading: "lazy" });
}
