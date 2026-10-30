import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { brainName } from '../components/BrainStack';
import { brainsApi, useInsights } from './useBrains';
const when = (lang, d) => d?.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { day: 'numeric', month: 'short' }) ?? '';
/** Home · what the Brains noticed lately (competitor changes, group readings). */
export function InsightsCard({ brandId }) {
    const { t, lang } = useI18n();
    const list = useInsights(brandId, undefined, 3);
    if (!list.length)
        return null;
    return (_jsxs("div", { className: "card col g12", "aria-labelledby": "h-insights", children: [_jsx("h2", { className: "h3", id: "h-insights", children: t('brains.news') }), list.map((i) => (_jsxs("div", { className: "col g4", style: { paddingTop: 8, borderTop: '1px solid var(--line)' }, children: [_jsxs("span", { className: "t-xs t-mute", children: [brainName(i.brain), " \u00B7 ", when(lang, i.at?.toDate())] }), _jsx("span", { className: "t-sm w7", children: i.title }), i.body && _jsx("span", { className: "t-sm t-mute", children: i.body }), i.url && _jsx("a", { className: "t-xs", href: i.url, target: "_blank", rel: "noreferrer", children: new URL(i.url).hostname })] }, i.id)))] }));
}
/** My brand · what the Brains learned from approvals and change requests. */
export function LearningsSection({ brandId }) {
    const { t, lang } = useI18n();
    const doc = useBrandDoc(brandId, 'context/learnings');
    const items = (doc.data?.items ?? []).slice(-8).reverse();
    if (!items.length)
        return null;
    return (_jsxs("section", { className: "col g16", "aria-labelledby": "h-learned", children: [_jsxs("div", { className: "col g4", children: [_jsx("h2", { className: "h2", id: "h-learned", children: t('brains.learned') }), _jsx("p", { className: "t-sm t-mute", children: t('brains.learnedSub') })] }), _jsx("div", { className: "grid gap-3 md:grid-cols-2", children: items.map((l, i) => (_jsxs("div", { className: "card card-tight col g4", children: [_jsx("span", { className: `chip self-start ${l.kind === 'liked' ? 'c-approved' : 'c-approve'}`, children: t(l.kind === 'liked' ? 'brains.liked' : 'brains.changed') }), _jsx("span", { className: "t-sm", children: l.text }), _jsx("span", { className: "t-xs t-mute", children: [l.brain && brainName(l.brain), l.at && when(lang, new Date(l.at))].filter(Boolean).join(' · ') })] }, i))) })] }));
}
/** Group overview · the Researcher reads every brand of the group together (owners and admin can ask). */
export function GroupAnalysis({ groupId, canAsk }) {
    const { t, lang } = useI18n();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const last = useInsights(groupId, 'group_analysis', 1)[0];
    const ask = async () => { setBusy(true); setError(false); try {
        await brainsApi.analyzeGroup(groupId);
    }
    catch {
        setError(true);
    }
    finally {
        setBusy(false);
    } };
    return (_jsxs("div", { className: "card col g12", children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsxs("div", { className: "col", children: [_jsx("h3", { className: "h3", children: t('brains.groupTitle') }), _jsx("span", { className: "t-xs t-mute", children: last ? `${t('brains.byResearcher')} · ${when(lang, last.at?.toDate())}` : t('brains.groupSub') })] }), canAsk && _jsx("button", { className: "btn btn-secondary btn-sm", disabled: busy, onClick: ask, children: busy ? t('brains.analyzing') : last ? t('brains.analyzeAgain') : t('brains.analyze') })] }), last && (_jsxs(_Fragment, { children: [_jsx("p", { className: "t-sm w7", children: last.title }), (last.insights ?? []).map((s, i) => _jsx("p", { className: "t-sm", style: { borderLeft: '3px solid var(--line)', paddingLeft: 10 }, children: s }, i)), (last.opportunities ?? []).length > 0 && _jsx("p", { className: "label", children: t('brains.opportunities') }), (last.opportunities ?? []).map((s, i) => _jsx("p", { className: "t-sm", style: { borderLeft: '3px solid #8B5CF6', paddingLeft: 10 }, children: s }, i))] })), error && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: t('brains.error') })] }));
}
