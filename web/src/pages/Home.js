import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from '../auth/AuthProvider';
import { useTour } from '../tour/useTour';
import { homeSteps } from '../tour/steps';
import { Link } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandsRequests } from '../requests/useBrandsRequests';
import { HomeHero } from '../home/HomeHero';
import { HomeDelivered } from '../home/HomeDelivered';
import { HomeProduction } from '../home/HomeProduction';
import { HomeMeetingsRow } from '../home/HomeMeetingsRow';
import { InsightsCard } from '../brains/BrainPanels';
import { LiveBanner } from '../home/HomeExtras';
import { LessonOfTheWeek } from '../criterio/LessonCards';
import { HomeThisMonth } from '../home/HomeThisMonth';
import { HomeBrainLoop } from '../brain/BrainLoop';
/**
 * Home, by hierarchy: the studio with what was launched (4 columns: studio 3, launches 1), what was delivered
 * and waits for approval (3), what is in production on its 48-business-hour clock (2), then meetings
 * (next 1 + history 3) and, last, the lesson and insights (2).
 */
export function Home() {
    const { current, brands } = useBrands();
    const { t, lang } = useI18n();
    const scope = current ? [current.id, ...brands.filter((b) => b.groupId && (b.groupId === current.id || brands.find((p) => p.id === b.groupId)?.groupId === current.id)).map((b) => b.id)] : [];
    const all = useBrandsRequests(scope);
    const { profile } = useAuth();
    useTour('home', () => homeSteps(lang), !!current, profile?.role !== 'admin');
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    const needsYou = all.filter((r) => r.status === 'to_approve');
    const inProd = all.filter((r) => r.status === 'in_production')
        .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));
    return (_jsxs("div", { className: "col g40", children: [current.onboarding && current.onboarding.step !== 'live' && (_jsxs(Link, { to: "/onboarding", className: "card row between g16 wrap", style: { textDecoration: 'none', color: 'var(--ink)', background: '#EAF0FF', border: 0 }, children: [_jsxs("span", { className: "col", children: [_jsx("span", { className: "w7", children: t('ob.continue') }), _jsx("span", { className: "t-sm t-mute", children: t('ob.continueSub', { step: t(`ob.a.step.${current.onboarding.step}`) }) })] }), _jsx("span", { className: "btn btn-primary btn-sm", children: t('common.continue') })] })), current.onboarding?.step === 'live' && _jsx(LiveBanner, { liveAt: current.onboarding.liveAt }), _jsx(HomeHero, { brandName: current.name, needsYou: needsYou, open: all }), current.kind === 'brand' && _jsx(HomeBrainLoop, { brandId: current.id }), _jsx(HomeThisMonth, { brandId: current.id, requests: all }), _jsx(HomeDelivered, { items: needsYou }), _jsx(HomeProduction, { items: inProd }), _jsx("div", { "data-tour": "home-meetings", children: _jsx(HomeMeetingsRow, { brandId: current.id, brandName: current.name }) }), _jsxs("div", { className: "grid items-start gap-4 lg:grid-cols-2", children: [_jsx(LessonOfTheWeek, {}), _jsx(InsightsCard, { brandId: current.id })] })] }));
}
