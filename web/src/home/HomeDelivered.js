import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { useBrands } from '../brands/BrandProvider';
import { brainName } from '../components/BrainStack';
import { useVersions } from '../requests/useRequests';
import { useFileUrl, isImage } from '../requests/useFileUrl';
/** Delivered and waiting for the client's approval: the piece itself, big, with one button to review it. Hidden when nothing waits. */
export function HomeDelivered({ items }) {
    const { t } = useI18n();
    if (!items.length)
        return null;
    return (_jsxs("section", { className: "col g16", "aria-labelledby": "h-delivered", "data-tour": "home-delivered", children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsxs("div", { className: "col g4", children: [_jsxs("h2", { className: "h3", id: "h-delivered", children: [t('hg.delivered'), " ", _jsx("span", { className: "chip c-group", style: { verticalAlign: 'middle' }, children: items.length })] }), _jsx("p", { className: "t-sm t-mute", children: t('hg.deliveredSub') })] }), _jsx(Link, { to: "/requests", className: "t-sm w7", children: t('home.seeAll') })] }), _jsx("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", children: items.slice(0, 3).map((r) => _jsx(Piece, { r: r }, `${r.brandId}/${r.id}`)) })] }));
}
function Piece({ r }) {
    const { t } = useI18n();
    const { select, current } = useBrands();
    const versions = useVersions(r.brandId, r.id);
    const v = versions.find((x) => x.id === r.latestVersion);
    const url = useFileUrl(r.brandId, r.id, v);
    const type = v?.files?.[0]?.contentType ?? '';
    return (_jsxs(Link, { to: `/requests/${r.id}`, onClick: () => current?.id !== r.brandId && select(r.brandId), className: "card col g12 min-w-0", style: { textDecoration: 'none', color: 'var(--ink)', padding: 12 }, children: [_jsx("div", { className: "overflow-hidden rounded-xl", style: { aspectRatio: '4 / 3', background: 'var(--niebla)' }, children: url && isImage(type) ? _jsx("img", { src: url, alt: "", className: "h-full w-full object-cover", loading: "lazy" })
                    : url && type.startsWith('video/') ? _jsx("video", { src: url, muted: true, playsInline: true, preload: "metadata", className: "h-full w-full object-cover" })
                        : _jsx("span", { className: "flex h-full items-center justify-center t-sm t-mute", children: v?.n ? t('home.version', { n: v.n }) : '' }) }), _jsxs("div", { className: "row g12", children: [_jsxs("div", { className: "col grow", style: { minWidth: 0 }, children: [_jsx("span", { className: "w7 truncate", children: r.title }), _jsxs("span", { className: "t-xs t-mute truncate", children: [v?.n ? `${t('home.version', { n: v.n })} · ` : '', r.approvalLevel === 'nicolas' ? t('req.madeByReviewed') : t('req.madeBy', { brain: brainName(r.leadBrain) })] })] }), _jsx("span", { className: "btn btn-primary btn-sm flex-none", children: t('home.review') })] })] }));
}
