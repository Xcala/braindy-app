import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { useBrandDoc } from '../brands/useBrandDoc';
import { ruleLines } from './knowledge';
import './loop.css';
const arr = (v) => (Array.isArray(v) ? v : []);
const clip = (s, n = 140) => { const one = s.replace(/\s+/g, ' ').trim(); return one.length > n ? `${one.slice(0, n - 1)}…` : one; };
/** Right after an approval or a change: what the Brand Brain just learned (the server records the same in brainEvents). */
export function LearnedMoment({ kind, text }) {
    const { t } = useI18n();
    return (_jsxs("div", { className: "bl-learned", role: "status", children: [_jsx("span", { className: "bl-ico", "aria-hidden": "true", children: _jsx(Icon, { name: "repeat", size: 16 }) }), _jsxs("div", { className: "col g4 min-w-0", children: [_jsx("span", { className: "t-sm w7", children: t(kind === 'approved' ? 'bl.learnedApproved' : 'bl.learnedChanged') }), text && _jsxs("span", { className: "t-sm", children: ["\u00AB", clip(text), "\u00BB"] }), _jsxs("span", { className: "t-xs t-mute", children: [t('bl.learnedNext'), " ", _jsx(Link, { to: "/brand/brain", className: "w7", style: { color: 'var(--azul)' }, children: t('bl.open') })] })] })] }));
}
/** New request: the piece is made with what the brand's Brain already knows (palette, type, tone, rules, past approvals). */
export function BrainKnows({ brandId }) {
    const { t } = useI18n();
    const identity = useBrandDoc(brandId, 'context/identity').data;
    const voice = useBrandDoc(brandId, 'context/voice').data;
    const brain = useBrandDoc(brandId, 'context/brain').data;
    const learnings = useBrandDoc(brandId, 'context/learnings').data;
    const colors = arr(identity?.colors).length, fonts = arr(identity?.typography).length;
    const tone = String(voice?.essence?.title ?? '').trim();
    const rules = ruleLines(brain).length, learned = arr(learnings?.items).length;
    const count = (n, k) => n && (n === 1 ? t(`bl.k.${k}1`) : t(`bl.k.${k}`, { n }));
    const parts = [
        count(colors, 'colors'), count(fonts, 'fonts'),
        voice && (tone ? t('bl.k.voice', { v: clip(tone, 40) }) : t('bl.k.voicePlain')),
        count(rules, 'rules'), count(learned, 'learned'),
    ].filter(Boolean);
    return (_jsxs("div", { className: "bl-knows", children: [_jsx("span", { className: "bl-ico", "aria-hidden": "true", children: _jsx(Icon, { name: "repeat", size: 14 }) }), _jsxs("span", { className: "col g4 min-w-0", children: [_jsx("span", { className: "t-sm w7", children: t('bl.knows') }), _jsx("span", { className: "t-xs t-mute", children: parts.length ? parts.join(' · ') : t('bl.knowsNone') })] })] }));
}
/** Cerebro: the changes the client asked for, which now go into every piece (and the quality check before delivery). */
export function BrainBetter({ learnings }) {
    const { t } = useI18n();
    const changes = arr(learnings?.items).filter((l) => l.kind === 'changed' && l.text).slice(-5).reverse();
    return (_jsxs("section", { className: "card card-tight col g12", "aria-labelledby": "h-bl-better", children: [_jsxs("div", { className: "col g4", children: [_jsx("h2", { className: "h3", id: "h-bl-better", children: t('bl.better') }), _jsx("p", { className: "t-sm t-mute", children: t('bl.betterSub') })] }), changes.length
                ? _jsx("ul", { className: "bb-pins", children: changes.map((c, i) => _jsx("li", { className: "t-sm", children: clip(c.text, 180) }, i)) })
                : _jsx("p", { className: "t-sm t-mute", children: t('bl.betterEmpty') })] }));
}
