import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router';
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { Gantt } from '../contracts/Gantt';
import { Checklist } from '../contracts/Checklist';
import { ContractDownload } from '../contracts/ContractDownload';
import { contractsApi } from '../contracts/api';
import { SessionPicker } from './SessionPicker';
/** Step 2 · Kickoff: the schedule by week, the kickoff meeting and the checklist of materials and accesses. */
export function KickoffStep({ brand }) {
    const { t } = useI18n();
    const schedule = useBrandDoc(brand.id, 'context/schedule').data;
    const kickoff = useBrandDoc(brand.id, 'context/kickoff').data;
    const contractId = brand.onboarding?.contractId;
    const contract = useBrandDoc(brand.id, `contracts/${contractId ?? '-'}`).data;
    const items = kickoff?.items ?? [];
    const done = items.filter((x) => x.done).length;
    return (_jsxs("section", { className: "col g20 min-w-0", children: [_jsxs("div", { className: "stage col g12 rounded-[20px] p-6 sm:p-9", children: [_jsx("p", { className: "label", children: t('ctr.step2') }), _jsxs("h1", { className: "d-lg", style: { color: '#fff', fontSize: 40, lineHeight: '44px' }, children: [_jsx("span", { className: "w9", children: t('ctr.kick1') }), " ", t('ctr.kick2')] }), _jsx("p", { className: "t-lg muted", children: t('ctr.kickSub') })] }), _jsx(SessionPicker, { brandId: brand.id, brandName: brand.name, bookedAt: brand.onboarding?.kickoffAt, kind: "kickoff" }), kickoff && (_jsxs("div", { className: "card col g12", style: { padding: 22 }, children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsx("h2", { className: "h3", children: t('ctr.checklist') }), _jsx("span", { className: "chip", children: t('ctr.doneOf', { done, total: items.length }) })] }), _jsx("p", { className: "t-sm t-mute", children: t('ctr.checklistTick') }), _jsx(Checklist, { items: items, start: kickoff.start, onToggle: (id, v) => { contractsApi.tick(brand.id, id, v).catch(() => undefined); } })] })), schedule && (_jsxs("div", { className: "card col g12", style: { padding: 22 }, children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsx("h2", { className: "h3", children: t('ctr.schedule') }), _jsx(Link, { to: "/plan", className: "btn btn-secondary btn-sm", children: t('plan.seeOnboarding') })] }), _jsx(Gantt, { schedule: schedule })] })), contract && contractId && _jsx(ContractDownload, { brandId: brand.id, contract: { id: contractId, ...contract } })] }));
}
