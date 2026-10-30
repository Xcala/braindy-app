import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Link } from 'react-router';
import { useBrands } from '../../brands/BrandProvider';
import { BrandMark } from '../../brands/BrandMark';
import { useI18n } from '../../i18n/I18nProvider';
import { brainName } from '../../components/BrainStack';
import { useOpenWork } from '../../team/useWork';
import { MembersCard } from '../../team/MembersCard';
import { useBrainTasks } from '../../brains/useBrains';
import { GranolaInbox } from '../../team/GranolaInbox';
import { TeamLineup } from '../../team/TeamLineup';
/** Active brands Nicolas takes on at once. */
const CAP = 50;
const BRAINS = ['researcher', 'marketer', 'creator', 'builder'];
const ago = (d) => {
    if (!d)
        return '';
    const h = (Date.now() - d.getTime()) / 3_600_000;
    return h < 24 ? `${Math.max(1, Math.round(h))} h` : `${Math.round(h / 24)} d`;
};
/** Admin Team: approval queue across brands, Brain load, capacity, members of the current brand. */
export function AdminTeam() {
    const { t } = useI18n();
    const { brands, current, select } = useBrands();
    const { items, loading } = useOpenWork();
    const active = brands.filter((b) => b.status === 'active' && b.kind === 'brand').length;
    const byId = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
    // Waiting on Nicolas: plans to approve, and work that needs his review before the client sees it.
    const queue = items.filter((i) => i.stage === 'plan' || (i.approvalLevel === 'nicolas' && i.stage === 'work' && (i.versionCount ?? 0) > 0))
        .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
    const tasks = useBrainTasks(true);
    const load = (b) => ({
        prod: items.filter((i) => i.leadBrain === b && i.status === 'in_production').length,
        approve: items.filter((i) => i.leadBrain === b && i.status === 'to_approve').length,
    });
    const open = (i) => select(i.brandId);
    return (_jsxs("div", { className: "col g24", children: [_jsxs("div", { className: "col g8", children: [_jsx("p", { className: "label", children: t('team.kicker') }), _jsxs("h1", { className: "h1", children: [_jsxs("span", { className: "w9", children: [t('nav.team'), "."] }), " ", t('team.tagline')] })] }), _jsx(TeamLineup, {}), _jsxs("div", { className: "card row g24 wrap", children: [_jsxs("div", { className: "col grow", style: { gap: 6, minWidth: 260 }, children: [_jsxs("div", { className: "row between", children: [_jsx("span", { className: "w7 t-sm", children: t('team.capacity') }), _jsx("span", { className: "t-xs t-mute", children: t('team.ceiling', { n: CAP }) })] }), _jsx("div", { className: "bar", children: _jsx("i", { style: { width: `${Math.min(100, (active / CAP) * 100)}%`, background: active > CAP * 0.8 ? 'var(--warning)' : 'var(--azul)' } }) }), _jsx("span", { className: "t-xs t-mute", children: t('team.activeBrands', { n: active }) })] }), _jsxs("div", { className: "row g24", children: [_jsx(Stat, { n: items.filter((i) => i.status === 'in_production').length, label: t('req.status.in_production') }), _jsx(Stat, { n: items.filter((i) => i.status === 'to_approve').length, label: t('req.status.to_approve') }), _jsx(Stat, { n: queue.length, label: t('team.waitingYou') })] })] }), _jsxs("section", { className: "col g12", "aria-labelledby": "q", children: [_jsxs("div", { className: "row between", children: [_jsx("h2", { className: "h3", id: "q", children: t('team.queue', { n: queue.length }) }), _jsx("span", { className: "t-sm t-mute", children: t('team.oldestFirst') })] }), loading && _jsx("div", { className: "skel", style: { height: 80 } }), !loading && queue.length === 0 && _jsx("div", { className: "card t-mute", children: t('team.queueEmpty') }), queue.map((i) => {
                        const b = byId.get(i.brandId);
                        return (_jsxs("div", { className: "card row g20 wrap", children: [_jsxs("div", { className: "col g4 grow", style: { minWidth: 220 }, children: [_jsxs("span", { className: "row g8", children: [b && _jsx("span", { className: "sel", style: { border: 0, height: 'auto', padding: 0, background: 'none' }, children: _jsx(BrandMark, { brand: b }) }), _jsx("span", { className: "t-sm t-mute", children: b?.name })] }), _jsxs("span", { className: "w7", children: [i.title, " \u00B7 ", i.stage === 'plan' ? t('team.planToApprove') : t('team.workToReview')] })] }), i.approvalLevel === 'nicolas' && _jsx("span", { className: "chip c-sent", children: t('ask.withNicolas') }), _jsx("span", { className: "t-sm t-mute", children: t('team.waiting', { time: ago(i.createdAt?.toDate()) }) }), _jsx(Link, { className: "btn btn-primary btn-sm", to: `/requests/${i.id}`, onClick: () => open(i), children: t('common.open') })] }, `${i.brandId}/${i.id}`));
                    })] }), _jsxs("div", { className: "grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.2fr_1fr]", children: [_jsxs("section", { className: "col g12", "aria-labelledby": "b", children: [_jsx("h2", { className: "h3", id: "b", children: t('team.brains') }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2", children: BRAINS.map((b) => {
                                    const l = load(b);
                                    const state = l.approve ? 'approval' : l.prod ? 'working' : 'idle';
                                    return (_jsxs("div", { className: "card col g12", children: [_jsxs("div", { className: "row g12", children: [_jsx("span", { className: `brain b-${b} brain-${state}`, children: _jsx("img", { src: `/brand/brains/${b}.png`, alt: "" }) }), _jsxs("div", { className: "col", children: [_jsx("span", { className: "w7", children: brainName(b) }), _jsx("span", { className: "t-xs", style: { color: state === 'approval' ? 'var(--warning)' : state === 'working' ? `var(--${b}-ink)` : 'var(--graphite)' }, children: t(`team.state.${state}`) })] })] }), _jsxs("div", { className: "col t-sm", style: { gap: 6 }, children: [_jsxs("div", { className: "row between", children: [_jsx("span", { children: t('req.status.in_production') }), _jsx("strong", { children: l.prod })] }), _jsxs("div", { className: "row between", children: [_jsx("span", { children: t('req.status.to_approve') }), _jsx("strong", { children: l.approve })] })] }), (() => {
                                                const running = tasks.find((x) => x.brain === b && x.status === 'running');
                                                const last = tasks.find((x) => x.brain === b && x.status === 'done');
                                                const task = running ?? last;
                                                if (!task)
                                                    return null;
                                                const brandName = brands.find((x) => x.id === task.brandId)?.name ?? task.brandId;
                                                return _jsx("span", { className: "t-xs t-mute truncate", children: t(running ? 'brains.now' : 'brains.lastDone', { title: `${task.title} · ${brandName}` }) });
                                            })()] }, b));
                                }) })] }), _jsxs("section", { className: "col g12", "aria-labelledby": "m", children: [_jsx("h2", { className: "h3", id: "m", children: t('team.members') }), current ? _jsx(MembersCard, { brandId: current.id, brandName: current.name }, current.id) : _jsx("p", { className: "t-mute", children: t('brand.none') }), _jsx("p", { className: "t-xs t-mute", children: t('team.membersHint') }), _jsx(GranolaInbox, {})] })] })] }));
}
function Stat({ n, label }) {
    return _jsxs("div", { className: "col", children: [_jsx("span", { className: "h2", children: n }), _jsx("span", { className: "t-xs t-mute", children: label })] });
}
