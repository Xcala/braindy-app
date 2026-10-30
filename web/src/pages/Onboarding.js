import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, Navigate } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { Steps } from '../onboarding/Steps';
import { BriefChat } from '../onboarding/BriefChat';
import { BrainCards } from '../onboarding/BrainCards';
import { SessionPicker } from '../onboarding/SessionPicker';
import { OnboardingLessons } from '../criterio/LessonCards';
/** First 11 days (design 17): one page that follows the brand's onboarding step. */
export function Onboarding() {
    const { current } = useBrands();
    const { t } = useI18n();
    const brainDoc = useBrandDoc(current?.id, 'context/brain');
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    const ob = current.onboarding;
    if (!ob || ob.step === 'live')
        return _jsx(Navigate, { to: "/home", replace: true });
    const brain = (brainDoc.data ?? {});
    const signed = brain.status === 'signed';
    return (_jsxs("div", { className: "grid grid-cols-1 items-start gap-7 lg:grid-cols-[320px_minmax(0,1fr)]", children: [_jsx(Steps, { step: ob.step }), ob.step === 'brief' && _jsxs("div", { className: "col g24 min-w-0", children: [_jsx(BriefChat, { brandId: current.id, brandName: current.name }), _jsx(OnboardingLessons, {})] }), (ob.step === 'brain' || ob.step === 'session') && (_jsxs("section", { className: "col g20", children: [_jsxs("div", { className: "stage grid items-center gap-6 rounded-[20px] p-6 sm:p-9 md:grid-cols-[minmax(0,1fr)_260px]", children: [_jsxs("div", { className: "col g12", children: [_jsxs("div", { className: "row g8 wrap", children: [_jsxs("p", { className: "label", children: [t('ob.day1'), " \u00B7 ", t('ob.byResearcher')] }), _jsx("span", { className: "chip c-draft", children: t('ob.namePending') })] }), _jsxs("h1", { className: "d-lg", style: { color: '#fff', fontSize: 44, lineHeight: '46px' }, children: [_jsx("span", { className: "w9", children: t('ob.brainReady1') }), " ", t('ob.brainReady2')] }), _jsx("p", { className: "t-lg muted", children: t('ob.brainReadySub') })] }), _jsxs("div", { className: "widget col", style: { alignItems: 'flex-start', gap: 8, position: 'static' }, children: [_jsx("span", { className: "t-xs", style: { color: '#C9D0DE' }, children: t('ob.signature') }), _jsxs("div", { className: "row g8", children: [_jsx("img", { src: "/brand/proposal/nicolas-face.jpg", alt: "", className: "h-10 w-10 rounded-full object-cover" }), _jsxs("div", { className: "col", children: [_jsx("span", { className: "w7 t-sm", children: signed ? t('ob.signedBy') : t('ob.waitingNicolas') }), _jsx("span", { className: "t-xs", style: { color: '#C9D0DE' }, children: t('ob.signDay2') })] })] })] })] }), _jsx(SessionPicker, { brandId: current.id, brandName: current.name, bookedAt: ob.sessionAt }), ob.step === 'session' && (_jsxs("div", { className: "card col g8", style: { padding: 22 }, children: [_jsx("h2", { className: "h3", children: t('ob.agenda') }), ['ob.agenda1', 'ob.agenda2', 'ob.agenda3', 'ob.agenda4'].map((k, i) => _jsxs("div", { className: "row g12 t-sm", children: [_jsxs("span", { className: "sec-num", children: ["0", i + 1] }), t(k)] }, k))] })), _jsx(BrainCards, { brain: brain }), _jsxs("div", { className: "card t-sm", style: { background: '#EAF0FF', border: 0 }, children: [_jsx("b", { children: t('ob.aiNoteBold') }), " ", t('ob.aiNote')] }), _jsx(OnboardingLessons, {})] })), ob.step === 'firstDelivery' && (_jsxs("section", { className: "col g20", children: [_jsxs("div", { className: "stage col g12 rounded-[20px] p-6 sm:p-9", children: [_jsx("p", { className: "label", children: t('ob.day35') }), _jsxs("h1", { className: "d-lg", style: { color: '#fff' }, children: [_jsx("span", { className: "w9", children: t('ob.signedTitle1') }), " ", t('ob.signedTitle2')] }), _jsx("p", { className: "t-lg muted", children: t('ob.signedSub') }), _jsxs("div", { className: "row g12 wrap", children: [_jsx(Link, { className: "btn btn-white", to: "/requests", children: t('ob.seeRequests') }), _jsx(Link, { className: "btn btn-outline-light", to: "/brand", children: t('ob.openBrain') })] })] }), _jsx(BrainCards, { brain: brain })] }))] }));
}
