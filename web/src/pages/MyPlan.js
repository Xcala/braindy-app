import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useSearchParams } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { contractsApi } from '../contracts/api';
import { PlanView } from '../plan/PlanView';
import { ContractCard } from '../plan/ContractCard';
import { AdminPlan } from '../plan/AdminPlan';
import { Subscription } from '../plan/Subscription';
import { BrandPieces } from '../plan/BrandPieces';
import { PaymentsIntro, SiteIntro, SummaryIntro } from '../plan/PlanIntros';
import { planApi, usePlan } from '../plan/usePlan';
/** Mi plan: everything the client contracted in one place. What they bought, the contract (sign it here, download it
 *  signed), the schedule by week with its deliveries, the kickoff checklist, the website's hosting and maintenance, the apps the brand runs on,
 *  and below, the design plan being billed and the site hosting tiers. */
export function MyPlan() {
    const { current } = useBrands();
    const { profile } = useAuth();
    const { t } = useI18n();
    const plan = usePlan(current?.id);
    const contractId = current?.onboarding?.contractId ?? null;
    const contractDoc = useBrandDoc(current?.id, `contracts/${contractId ?? '-'}`);
    const live = useBrandDoc(current?.id, 'context/schedule').data;
    const kickoff = useBrandDoc(current?.id, 'context/kickoff').data;
    const stack = useBrandDoc(current?.id, 'billing/stack').data?.items ?? null;
    const admin = profile?.role === 'admin';
    const [params, setParams] = useSearchParams();
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    if (plan === undefined || (contractId && contractDoc.loading))
        return _jsxs("p", { className: "t-mute", children: [t('common.loading'), "\u2026"] });
    const id = current.id;
    const contract = contractId && contractDoc.data ? { id: contractId, ...contractDoc.data } : null;
    // After signing, the live schedule (statuses move); before, the contract's Anexo 2 as sent or drafted.
    const schedule = live ?? contract?.schedule ?? null;
    const editable = live ? 'live' : contract?.status === 'draft' ? 'draft' : null;
    function setRow(gi, ri, status) {
        if (!schedule || !editable)
            return;
        const next = { ...schedule, groups: schedule.groups.map((g, i) => (i !== gi ? g : { ...g, rows: g.rows.map((r, j) => (j === ri ? { ...r, status } : r)) })) };
        void (editable === 'live' ? contractsApi.saveSchedule(id, next) : contractsApi.save(id, contract.id, { schedule: next }));
    }
    // Tabs instead of one long page; the schedule tab only when there is a schedule or a kickoff checklist.
    const tabs = ['summary', ...(schedule || kickoff?.items.length ? ['schedule'] : []), 'brand', 'site', 'payments'];
    const asked = params.get('tab');
    const tab = asked && tabs.includes(asked) ? asked : 'summary';
    const switcher = (_jsx("nav", { className: "seg seg-scroll", "aria-label": t('plan.title'), children: tabs.map((k) => _jsx("button", { type: "button", className: tab === k ? 'is-on' : '', "aria-pressed": tab === k, onClick: () => setParams(k === 'summary' ? {} : { tab: k }, { replace: true }), children: t(`plan.tab.${k}`) }, k)) }));
    return (_jsxs("div", { className: "col g32", children: [_jsx(PlanView, { tab: tab, tabs: switcher, site: _jsx(Subscription, { current: current, part: "hosting" }), brand: _jsx(BrandPieces, { brand: current }), intros: { summary: _jsx(SummaryIntro, { brand: current }), site: _jsx(SiteIntro, { brand: current }), payments: _jsx(PaymentsIntro, { brand: current }) }, payments: _jsxs("div", { className: "col g16", children: [_jsx(Subscription, { current: current, part: "design" }), _jsxs("p", { className: "t-sm t-mute", style: { margin: 0 }, children: [t('plan.paymentsIn'), " ", _jsx(Link, { to: "/settings?tab=billing", className: "w7", children: t('set.tab.billing') })] })] }), brandName: current.name, plan: plan, stack: stack ?? undefined, schedule: schedule, kickoff: kickoff, contract: _jsx(ContractCard, { brandId: id, contract: contract }), onPackStatus: admin ? (i, st) => { void planApi.packStatus(id, i, st); } : undefined, onRowStatus: admin && editable ? setRow : undefined, onTick: (itemId, done) => { contractsApi.tick(id, itemId, done).catch(() => undefined); } }), !plan && !schedule && !stack?.length && _jsx("div", { className: "card t-mute", children: t('plan.empty') }), admin && tab === 'summary' && _jsx(AdminPlan, { brandId: id, plan: plan, stack: stack }, id)] }));
}
