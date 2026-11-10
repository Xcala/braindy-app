import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { ruleLines } from './knowledge';
import { bold } from '../components/Scan';
const arr = (v) => (Array.isArray(v) ? v : []);
/** How the Brains use the Brain on each request: the layers they read (mirrors server/src/brains/context.ts), the rules, the gaps. */
export function BrainUse({ identity, voice, brain, learnings, talks, requests, gaps }) {
    const { t } = useI18n();
    const learned = arr(learnings?.items).length;
    const brainFields = ['position', 'audiences', 'goals', 'avoid', 'criterio'].filter((k) => brain?.[k]).length;
    const layers = [
        { k: 'brain', n: brainFields, label: t('bb.l.brain'), d: t('bb.l.brainD'), c: 'var(--azul)' },
        { k: 'identity', n: arr(identity?.colors).length + arr(identity?.typography).length, label: t('bb.l.identity'), d: t('bb.l.identityD', { colors: arr(identity?.colors).length, fonts: arr(identity?.typography).length }), c: 'var(--creator)' },
        { k: 'voice', n: voice ? 2 : 0, label: t('bb.l.voice'), d: t('bb.l.voiceD'), c: 'var(--marketer)' },
        { k: 'learn', n: Math.min(15, learned), label: t('bb.l.learn'), d: t('bb.l.learnD', { n: Math.min(15, learned), total: learned }), c: 'var(--success)' },
        { k: 'work', n: Math.min(10, requests), label: t('bb.l.work'), d: t('bb.l.workD'), c: 'var(--builder)' },
        { k: 'talks', n: Math.min(5, talks), label: t('bb.l.talks'), d: t('bb.l.talksD'), c: 'var(--researcher)' },
    ].filter((l) => l.n > 0);
    const total = layers.reduce((s, l) => s + l.n, 0) || 1;
    const rules = ruleLines(brain).slice(0, 12);
    return (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "col g4", children: [_jsx("h2", { className: "h2", children: t('bb.use') }), _jsx("p", { className: "t-mute", style: { maxWidth: '70ch' }, children: t('bb.useSub') })] }), _jsxs("div", { className: "bb-use", children: [_jsxs("section", { className: "card card-tight col g16", children: [_jsx("h3", { className: "h3", children: t('bb.ctx') }), _jsx("div", { className: "bb-stack", "aria-hidden": "true", children: layers.map((l) => _jsx("i", { style: { flexGrow: l.n, background: l.c } }, l.k)) }), _jsx("ul", { className: "bb-layers", children: layers.map((l) => (_jsxs("li", { children: [_jsx("span", { className: "bb-sw", style: { background: l.c } }), _jsxs("div", { className: "col", children: [_jsx("span", { className: "t-sm w7", children: l.label }), _jsx("span", { className: "t-xs t-mute", children: l.d })] }), _jsxs("span", { className: "mono t-mute", children: [Math.round(l.n / total * 100), " %"] })] }, l.k))) }), _jsx("p", { className: "t-xs t-mute", children: t('bb.ctxNever') })] }), _jsxs("section", { className: "card card-tight col g12", children: [_jsxs("div", { className: "col g4", children: [_jsx("h3", { className: "h3", children: t('bb.rules') }), _jsx("p", { className: "t-sm t-mute", children: t('bb.rulesSub') })] }), rules.length ? _jsx("ul", { className: "bb-pins", children: rules.map((r, i) => _jsx("li", { className: "t-sm", children: bold(r) }, i)) }) : _jsx("p", { className: "t-sm t-mute", children: t('bb.rulesEmpty') })] }), _jsxs("section", { className: "card card-tight col g12", children: [_jsxs("div", { className: "col g4", children: [_jsx("h3", { className: "h3", children: t('bb.gaps') }), _jsx("p", { className: "t-sm t-mute", children: t('bb.gapsSub') })] }), gaps.length ? _jsx("ul", { className: "bb-gaps", children: gaps.slice(0, 6).map((g) => _jsx("li", { className: "t-sm", children: t(g) }, g)) }) : _jsx("p", { className: "t-sm t-mute", children: t('bb.gapsNone') })] })] })] }));
}
