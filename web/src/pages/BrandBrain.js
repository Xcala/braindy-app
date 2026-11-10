import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { BrainCanvas, brainColor } from '../brain/BrainCanvas';
import { BrainFeed, ago, eventText } from '../brain/BrainFeed';
import { BrainUse } from '../brain/BrainUse';
import { AREAS, countKnowledge, gaps } from '../brain/knowledge';
import { useBrainEvents } from '../brain/useBrainEvents';
import { BrainLoopSteps } from '../brain/BrainLoop';
import { BrainBetter } from '../brain/BrainLearned';
import '../brain/brain.css';
/**
 * My brand › Brain: what NickMark and his Brains know about the brand, live. Every request, approval, change asked,
 * Mi marca update, file, session and meeting arrives as an event (brands/{id}/brainEvents) and is animated into the brain.
 */
export function BrandBrain() {
    const { current } = useBrands();
    const { t } = useI18n();
    const brandId = current?.kind === 'brand' ? current.id : undefined;
    const identity = useBrandDoc(brandId, 'context/identity').data;
    const voice = useBrandDoc(brandId, 'context/voice').data;
    const brain = useBrandDoc(brandId, 'context/brain').data;
    const primal = useBrandDoc(brandId, 'context/primal').data;
    const learnings = useBrandDoc(brandId, 'context/learnings').data;
    const canvas = useRef(null);
    const [fresh, setFresh] = useState(new Set());
    const [toast, setToast] = useState('');
    const [replaying, setReplaying] = useState(false);
    const toastTimer = useRef(0);
    const onNew = useCallback((e) => {
        canvas.current?.learn(e.kind, e.area);
        setFresh((s) => new Set(s).add(e.id));
        setToast(t('bb.toast', { text: eventText(e, t) }));
        clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(''), 3200);
    }, [t]);
    const { events, talks } = useBrainEvents(brandId, onNew);
    const counts = useMemo(() => countKnowledge({ identity, voice, brain, primal, learnings, talks }), [identity, voice, brain, primal, learnings, talks]);
    const total = AREAS.reduce((s, a) => s + counts[a], 0);
    const color = brainColor((identity?.colors ?? [])[0]?.hex);
    // Quietly draw what it already knows; only new events fly in.
    useEffect(() => { if (!replaying)
        canvas.current?.sync(counts); }, [counts, replaying]);
    const replay = async () => {
        const c = canvas.current;
        if (!c || replaying)
            return;
        setReplaying(true);
        c.reset();
        const story = events.slice(0, 40).reverse();
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        const share = Math.max(0, Math.floor((total - story.length) / Math.max(1, story.length)));
        for (const e of story) {
            c.learn(e.kind, e.area, { fast: true });
            // The many small things learned around that moment, spread over the areas it knows.
            for (let i = 0; i < share; i++) {
                const a = AREAS[Math.floor(Math.random() * AREAS.length)];
                if (counts[a])
                    c.fill(a, 1);
            }
            await wait(320);
        }
        await wait(700);
        c.sync(counts);
        setReplaying(false);
    };
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    if (!brandId)
        return _jsx("div", { className: "card t-mute", children: t('bb.groupNone') });
    const last = events[0]?.at ?? null;
    return (_jsxs("div", { className: "col g32", children: [_jsxs("div", { className: "row between g24 wrap", style: { alignItems: 'flex-end' }, children: [_jsxs("div", { className: "col g8", style: { maxWidth: 720 }, children: [_jsx("p", { className: "label", children: current.name }), _jsxs("h1", { className: "h1", children: [_jsx("span", { className: "w9", children: t('bb.title') }), " ", total === 1 ? t('bb.knowsOne') : t('bb.knows', { n: total })] }), _jsxs("p", { className: "t-mute", children: [_jsx("strong", { className: "w7", style: { color: 'var(--ink)' }, children: t('bl.line') }), " ", t('bb.lede')] })] }), _jsxs("div", { className: "bb-stat", children: [_jsx("span", { className: "t-xs t-mute", children: t('bb.last') }), _jsx("b", { className: "mono", children: ago(last, t) })] })] }), _jsx(BrainLoopSteps, { on: fresh.size ? 'learn' : undefined }, fresh.size), _jsxs("div", { className: "bb-grid", children: [_jsxs("section", { className: "bb-brain col", "aria-labelledby": "h-bb-brain", children: [_jsxs("div", { className: "row between g12", style: { padding: '20px 24px 0', alignItems: 'flex-start' }, children: [_jsxs("div", { className: "col g4", children: [_jsx("h2", { className: "h3", id: "h-bb-brain", children: t('bb.growing') }), _jsx("p", { className: "t-sm bb-muted", children: t('bb.growingSub') })] }), _jsx("button", { type: "button", className: "bb-replay", onClick: replay, disabled: replaying || !events.length, children: replaying ? t('bb.replaying') : t('bb.replay') })] }), _jsx(BrainCanvas, { ref: canvas, counts: counts, color: color, showNumbers: !replaying }), _jsx("div", { className: `bb-toast${toast ? ' is-on' : ''}`, role: "status", "aria-live": "polite", children: toast })] }), _jsx(BrainFeed, { events: events, fresh: fresh })] }), _jsx(BrainBetter, { learnings: learnings }), _jsx(BrainUse, { identity: identity, voice: voice, brain: brain, learnings: learnings, talks: talks, requests: events.filter((e) => e.kind === 'request').length, gaps: gaps({ identity, voice, brain, learnings, talks }) })] }));
}
