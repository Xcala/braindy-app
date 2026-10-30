import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from '../auth/AuthProvider';
import { useTour } from '../tour/useTour';
import { homeSteps } from '../tour/steps';
import { Link } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { brainName } from '../components/BrainStack';
import { dayLabel, isOverdue } from '../lib/dates';
import { useBrandsRequests } from '../requests/useBrandsRequests';
import { useVersions } from '../requests/useRequests';
import { useFileUrl, isImage } from '../requests/useFileUrl';
import { HomeHero } from '../home/HomeHero';
import { HomeStudio } from '../home/HomeStudio';
import { InsightsCard } from '../brains/BrainPanels';
import { LiveBanner, ResultsCard, WhatsappCard } from '../home/HomeExtras';
import { LessonOfTheWeek } from '../criterio/LessonCards';
export function Home() {
    const { current, brands, select } = useBrands();
    const { t, lang } = useI18n();
    const scope = current ? [current.id, ...brands.filter((b) => b.groupId && (b.groupId === current.id || brands.find((p) => p.id === b.groupId)?.groupId === current.id)).map((b) => b.id)] : [];
    const all = useBrandsRequests(scope);
    const { profile } = useAuth();
    useTour('home', () => homeSteps(lang), !!current, profile?.role !== 'admin');
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    const needsYou = all.filter((r) => r.status === 'to_approve');
    const inProd = all.filter((r) => r.status === 'in_production')
        .sort((a, b) => String(a.dueDate ?? '9999').localeCompare(String(b.dueDate ?? '9999'))).slice(0, 5);
    const delivered = all.filter((r) => r.status === 'approved' || r.status === 'published').slice(0, 3);
    const brandOf = (id) => brands.find((b) => b.id === id);
    return (_jsxs("div", { className: "col g32", children: [current.onboarding && current.onboarding.step !== 'live' && (_jsxs(Link, { to: "/onboarding", className: "card row between g16 wrap", style: { textDecoration: 'none', color: 'var(--ink)', background: '#EAF0FF', border: 0 }, children: [_jsxs("span", { className: "col", children: [_jsx("span", { className: "w7", children: t('ob.continue') }), _jsx("span", { className: "t-sm t-mute", children: t('ob.continueSub', { step: t(`ob.a.step.${current.onboarding.step}`) }) })] }), _jsx("span", { className: "btn btn-primary btn-sm", children: t('common.continue') })] })), current.onboarding?.step === 'live' && _jsx(LiveBanner, { liveAt: current.onboarding.liveAt }), _jsx(HomeHero, { brandName: current.name, needsYou: needsYou, open: all }), _jsx(HomeStudio, { requests: all }), _jsxs("div", { className: "grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]", children: [_jsxs("div", { className: "col g32 min-w-0", children: [_jsxs("section", { className: "col g12", "aria-labelledby": "h-moving", "data-tour": "home-prod", children: [_jsxs("div", { className: "row between", children: [_jsx("h2", { className: "h3", id: "h-moving", children: t('home.thisWeek') }), _jsx(Link, { to: "/requests", className: "t-sm w7", children: t('home.seeAll') })] }), inProd.length === 0 && _jsx("div", { className: "card t-mute", children: t('home.nothingInProd') }), inProd.map((r) => {
                                        const late = isOverdue(r.dueDate);
                                        return (_jsxs(Link, { to: `/requests/${r.id}`, onClick: () => current.id !== r.brandId && select(r.brandId), className: "card row g16", style: { textDecoration: 'none', color: 'var(--ink)' }, children: [r.leadBrain && _jsx("img", { src: `/brand/brains/${r.leadBrain}.png`, alt: "", className: "h-10 w-10 flex-none rounded-full", style: { background: 'var(--niebla)' } }), _jsxs("div", { className: "col g4 grow", style: { minWidth: 0 }, children: [_jsx("span", { className: "w7 truncate", children: r.title }), _jsxs("span", { className: "t-sm t-mute truncate", children: [r.brandId !== current.id ? `${brandOf(r.brandId)?.name} · ` : '', r.stage === 'plan' ? t('home.planning', { brain: brainName(r.leadBrain) }) : t('req.onIt', { brain: brainName(r.leadBrain) })] })] }), r.dueDate && (_jsx("span", { className: `t-xs whitespace-nowrap ${late ? 'w7' : 't-mute'}`, style: late ? { color: '#C0362C' } : undefined, children: t(late ? 'home.late' : 'home.dueDay', { day: dayLabel(r.dueDate, lang) }) }))] }, `${r.brandId}/${r.id}`));
                                    })] }), _jsxs("section", { className: "col g12", "aria-labelledby": "h-recent", "data-tour": "home-delivered", children: [_jsxs("div", { className: "row between", children: [_jsx("h2", { className: "h3", id: "h-recent", children: t('home.recent') }), _jsx(Link, { to: "/assets", className: "t-sm w7", children: t('home.openAssets') })] }), delivered.length === 0 ? _jsx("div", { className: "card t-mute", children: t('home.nothingDelivered') }) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-3", children: delivered.map((r) => _jsx(DeliveredShot, { r: r }, `${r.brandId}/${r.id}`)) }))] })] }), _jsxs("aside", { className: "col g16 min-w-0", children: [_jsx(ResultsCard, { brandId: current.id }), _jsx(InsightsCard, { brandId: current.id }), _jsx(LessonOfTheWeek, {}), _jsx(WhatsappCard, { brandId: current.id })] })] })] }));
}
function DeliveredShot({ r }) {
    const { t } = useI18n();
    const versions = useVersions(r.brandId, r.id);
    const v = versions.find((x) => x.id === r.latestVersion) ?? versions[versions.length - 1];
    const url = useFileUrl(r.brandId, r.id, v);
    return (_jsxs(Link, { to: `/requests/${r.id}`, className: "shot block overflow-hidden rounded-2xl", style: { aspectRatio: '4 / 5', background: 'var(--niebla)' }, children: [url && isImage(v?.files?.[0]?.contentType) ? _jsx("img", { src: url, alt: r.title, className: "h-full w-full object-cover", loading: "lazy" }) : _jsx("span", { className: "flex h-full items-center justify-center p-4 text-center t-sm t-mute", children: r.title }), _jsxs("span", { className: "tag", children: [r.title, " \u00B7 ", t(`req.status.${r.status}`)] })] }));
}
