import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import { useVersions } from '../requests/useRequests';
import { useFileUrl, isImage } from '../requests/useFileUrl';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { dayLabel, daysFrom } from '../lib/dates';
import { CONTACT } from '../proposals/public/copy';
import { TypedNext } from './TypedNext';
const BRAINS = ['researcher', 'marketer', 'creator', 'builder'];
/** Home hero: what needs you (every item, up to three) and NickMark, who makes the work, with his Brains as a signature. */
export function HomeHero({ brandName, needsYou, open }) {
    const { t, lang } = useI18n();
    const today = new Date().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const shown = needsYou.slice(0, 3);
    const working = (b) => open.some((r) => r.leadBrain === b && r.status === 'in_production');
    const next = open
        .filter((r) => r.status === 'in_production' && r.dueDate && (daysFrom(r.dueDate) ?? -1) >= 0)
        .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0];
    const current = open.find((r) => r.status === 'in_production');
    const logo = useBrandLogo();
    return (_jsxs("section", { className: "stage grid gap-10 rounded-[28px] p-6 sm:p-12 lg:grid-cols-[1.25fr_1fr]", "aria-labelledby": "h-home", children: [_jsxs("div", { className: "col g24 min-w-0", "data-tour": "home-needs", children: [_jsxs("p", { className: "label", style: { color: '#C9D0DE' }, children: [today, " \u00B7 ", brandName] }), _jsx("h1", { className: "d-lg", id: "h-home", style: { color: '#fff' }, children: needsYou.length
                            ? _jsxs(_Fragment, { children: [_jsx("span", { className: "w9", children: t(needsYou.length === 1 ? 'home.needsOne' : 'home.needsN', { n: needsYou.length }) }), " ", t('home.restMoving')] })
                            : _jsxs(_Fragment, { children: [_jsx("span", { className: "w9", children: t('home.nothingNeeds') }), _jsx("br", {}), t('home.possibleSub')] }) }), shown.length > 0 && _jsx("div", { className: "col g12", children: shown.map((r) => _jsx(NeedItem, { r: r }, `${r.brandId}/${r.id}`)) }), needsYou.length > 3 && _jsx(Link, { to: "/requests", className: "t-sm w7", style: { color: '#fff' }, children: t('home.moreToReview', { n: needsYou.length - 3 }) }), logo && (_jsx("div", { className: "self-start rounded-[16px] bg-white", style: { padding: '12px 18px', boxShadow: '0 8px 30px rgba(0,0,0,.25)' }, children: _jsx("img", { src: logo, alt: brandName, style: { height: 44, maxWidth: 220, objectFit: 'contain', display: 'block' } }) }))] }), _jsx("div", { className: "col g16 min-w-0 justify-end", "data-tour": "home-brains", children: _jsxs("div", { className: "widget col g16", style: { position: 'static' }, children: [_jsxs("div", { className: "row g12", children: [_jsx("img", { src: "/brand/proposal/nicolas-face.jpg", alt: "", className: "h-14 w-14 flex-none rounded-full object-cover" }), _jsxs("div", { className: "col grow", children: [_jsx("span", { className: "w7", children: t('sig.card') }), _jsx("span", { className: "t-xs muted", children: t('home.orchestrator') })] }), _jsx("a", { className: "btn btn-white btn-sm", href: `https://wa.me/${CONTACT.whatsapp}`, target: "_blank", rel: "noreferrer", children: t('home.talk') })] }), _jsx("p", { className: "t-sm", style: { color: '#E6EAF2' }, children: next ? t('home.nicoNowDue', { title: next.title, day: dayLabel(next.dueDate, lang) })
                                : current ? t('home.nicoNow', { title: current.title }) : _jsx(TypedNext, {}) }), _jsxs("div", { className: "row g12 wrap", style: { borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 12 }, children: [_jsx("span", { className: "row", "aria-label": BRAINS.map(brainName).join(', '), children: BRAINS.map((b, i) => (_jsxs("span", { title: `${brainName(b)}${working(b) ? ` · ${t('team.state.working')}` : ''}`, className: "relative", style: { marginLeft: i ? -8 : 0 }, children: [_jsx("img", { src: `/brand/brains/${b}.png`, alt: "", className: "h-9 w-9 rounded-full", style: { background: '#0B1020', boxShadow: '0 0 0 2px #0B1020' } }), working(b) && _jsx("i", { className: "absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full", style: { background: '#8FA0FF', boxShadow: '0 0 0 2px #0B1020' } })] }, b))) }), _jsx("span", { className: "t-xs muted", children: t('home.withBrains') })] })] }) })] }));
}
function NeedItem({ r }) {
    const { t } = useI18n();
    const { select, current } = useBrands();
    const versions = useVersions(r.brandId, r.id);
    const v = versions.find((x) => x.id === r.latestVersion);
    const url = useFileUrl(r.brandId, r.id, v);
    return (_jsxs("div", { className: "widget row g16", style: { position: 'static', padding: 14 }, children: [_jsx("div", { className: "flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-xl", style: { background: 'rgba(255,255,255,.1)' }, children: url && isImage(v?.files?.[0]?.contentType) ? _jsx("img", { src: url, alt: "", className: "h-full w-full object-cover" }) : _jsx("span", { className: "t-xs muted", children: v?.n ?? '' }) }), _jsxs("div", { className: "col g4 grow", style: { minWidth: 0 }, children: [_jsx("span", { className: "w7 truncate", children: r.title }), _jsxs("span", { className: "t-xs muted", children: [v?.n ? `${t('home.version', { n: v.n })} · ` : '', r.approvalLevel === 'nicolas' ? t('req.madeByReviewed') : t('req.madeBy', { brain: brainName(r.leadBrain) })] })] }), _jsx(Link, { className: "btn btn-white btn-sm flex-none", to: `/requests/${r.id}`, onClick: () => current?.id !== r.brandId && select(r.brandId), children: t('home.review') })] }));
}
/** The current brand's main logo (identity first, then the logo saved on the brand), so the home shows whose space this is. */
function useBrandLogo() {
    const { current } = useBrands();
    const identity = useBrandDoc(current?.id, 'context/identity');
    const logos = identity.data?.logos;
    return logos?.primary ?? current?.logoUrl ?? logos?.secondary ?? null;
}
