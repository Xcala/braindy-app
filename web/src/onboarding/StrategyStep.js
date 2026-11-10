import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { BriefChat } from './BriefChat';
import { BrainCards } from './BrainCards';
import { SessionPicker } from './SessionPicker';
import { OnboardingLessons } from '../criterio/LessonCards';
const TRAINING = [
    { to: '/requests', title: 'ctr.tr.requests', sub: 'ctr.tr.requestsSub' },
    { to: '/requests', title: 'ctr.tr.approve', sub: 'ctr.tr.approveSub' },
    { to: '/assets', title: 'ctr.tr.files', sub: 'ctr.tr.filesSub' },
    { to: '/accesses', title: 'ctr.tr.accesses', sub: 'ctr.tr.accessesSub' },
];
/** The platform, in four uses: the training of step 3. */
function Training() {
    const { t } = useI18n();
    return (_jsxs("div", { className: "card col g12", style: { padding: 22 }, children: [_jsx("h2", { className: "h3", children: t('ctr.trTitle') }), _jsx("p", { className: "t-sm t-mute", children: t('ctr.trSub') }), _jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: TRAINING.map((x, i) => (_jsxs(Link, { to: x.to, className: "card col g4", style: { padding: 16, textDecoration: 'none', color: 'var(--ink)', background: '#F7F8FB', border: 0 }, children: [_jsxs("span", { className: "sec-num", children: ["0", i + 1] }), _jsx("span", { className: "w7", children: t(x.title) }), _jsx("span", { className: "t-xs t-mute", children: t(x.sub) })] }, x.title))) })] }));
}
/** Step 3 · Strategy and training: the brief questions support the Brand Brain that Nicolas signs. */
export function StrategyStep({ brand }) {
    const { t } = useI18n();
    const brain = (useBrandDoc(brand.id, 'context/brain').data ?? {});
    const ob = brand.onboarding;
    const signed = brain.status === 'signed';
    if (ob.step === 'brief') {
        return (_jsxs("div", { className: "col g24 min-w-0", children: [_jsxs("div", { className: "stage col g12 rounded-[20px] p-6 sm:p-9", children: [_jsx("p", { className: "label", children: t('ctr.step3') }), _jsxs("h1", { className: "d-lg", style: { color: '#fff', fontSize: 40, lineHeight: '44px' }, children: [_jsx("span", { className: "w9", children: t('ctr.strat1') }), " ", t('ctr.strat2')] }), _jsx("p", { className: "t-lg muted", children: t('ctr.stratSub') })] }), _jsx(Training, {}), _jsx(BriefChat, { brandId: brand.id, brandName: brand.name }), _jsx(OnboardingLessons, {})] }));
    }
    if (ob.step === 'firstDelivery') {
        return (_jsxs("section", { className: "col g20", children: [_jsxs("div", { className: "stage col g12 rounded-[20px] p-6 sm:p-9", children: [_jsx("p", { className: "label", children: t('ctr.step3') }), _jsxs("h1", { className: "d-lg", style: { color: '#fff' }, children: [_jsx("span", { className: "w9", children: t('ob.signedTitle1') }), " ", t('ob.signedTitle2')] }), _jsx("p", { className: "t-lg muted", children: t('ob.signedSub') }), _jsxs("div", { className: "row g12 wrap", children: [_jsx(Link, { className: "btn btn-white", to: "/requests", children: t('ob.seeRequests') }), _jsx(Link, { className: "btn btn-outline-light", to: "/brand", children: t('ob.openBrain') })] })] }), _jsx(BrainCards, { brain: brain })] }));
    }
    return (_jsxs("section", { className: "col g20", children: [_jsxs("div", { className: "stage grid items-center gap-6 rounded-[20px] p-6 sm:p-9 md:grid-cols-[minmax(0,1fr)_260px]", children: [_jsxs("div", { className: "col g12", children: [_jsxs("div", { className: "row g8 wrap", children: [_jsxs("p", { className: "label", children: [t('ctr.step3'), " \u00B7 ", t('ob.byResearcher')] }), _jsx("span", { className: "chip c-draft", children: t('ob.namePending') })] }), _jsxs("h1", { className: "d-lg", style: { color: '#fff', fontSize: 44, lineHeight: '46px' }, children: [_jsx("span", { className: "w9", children: t('ob.brainReady1') }), " ", t('ob.brainReady2')] }), _jsx("p", { className: "t-lg muted", children: t('ob.brainReadySub') })] }), _jsxs("div", { className: "widget col", style: { alignItems: 'flex-start', gap: 8, position: 'static' }, children: [_jsx("span", { className: "t-xs", style: { color: '#C9D0DE' }, children: t('ob.signature') }), _jsxs("div", { className: "row g8", children: [_jsx("img", { src: "/brand/proposal/nicolas-face.jpg", alt: "", className: "h-10 w-10 rounded-full object-cover" }), _jsxs("div", { className: "col", children: [_jsx("span", { className: "w7 t-sm", children: signed ? t('ob.signedBy') : t('ob.waitingNicolas') }), _jsx("span", { className: "t-xs", style: { color: '#C9D0DE' }, children: t('ob.signDay2') })] })] })] })] }), _jsx(SessionPicker, { brandId: brand.id, brandName: brand.name, bookedAt: ob.sessionAt }), ob.step === 'session' && (_jsxs("div", { className: "card col g8", style: { padding: 22 }, children: [_jsx("h2", { className: "h3", children: t('ob.agenda') }), ['ob.agenda1', 'ob.agenda2', 'ob.agenda3', 'ob.agenda4'].map((k, i) => _jsxs("div", { className: "row g12 t-sm", children: [_jsxs("span", { className: "sec-num", children: ["0", i + 1] }), t(k)] }, k))] })), _jsx(BrainCards, { brain: brain }), _jsx(Training, {}), _jsxs("div", { className: "card t-sm", style: { background: '#EAF0FF', border: 0 }, children: [_jsx("b", { children: t('ob.aiNoteBold') }), " ", t('ob.aiNote')] }), _jsx(OnboardingLessons, {})] }));
}
