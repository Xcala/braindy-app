import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useBrandDoc } from '../../brands/useBrandDoc';
import { useI18n } from '../../i18n/I18nProvider';
import { apiError, contractsApi } from '../api';
import { ContractText } from '../ContractText';
import { ContractDownload } from '../ContractDownload';
import { SignaturePad } from '../SignaturePad';
import { TermsForm } from './TermsForm';
import { GanttEditor } from './GanttEditor';
import { ChecklistEditor } from './ChecklistEditor';
/** The terms the one-step form asks for; the rest come filled in under "More conditions". */
const MAIN = ['objeto', 'pago.cuota', 'plazo.meses', 'plazo.inicio'];
/** Admin · the contract of a brand in one step: a few fields, your signature, send. The client's signature closes it. */
export function ContractPanel({ brand }) {
    const { t } = useI18n();
    const contractId = brand.onboarding?.contractId ?? null;
    const live = useBrandDoc(brand.id, `contracts/${contractId ?? '-'}`);
    const liveSchedule = useBrandDoc(brand.id, 'context/schedule').data;
    const [draft, setDraft] = useState(null);
    const [preview, setPreview] = useState(null);
    const [signature, setSignature] = useState(null);
    const [schedule, setSchedule] = useState(null);
    const [missing, setMissing] = useState([]);
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    const contract = live.data && contractId ? { id: contractId, ...live.data } : null;
    useEffect(() => { if (contract && (!draft || draft.id !== contract.id || draft.status !== contract.status))
        setDraft(contract); }, [contract, draft]);
    useEffect(() => { if (liveSchedule && !schedule)
        setSchedule(liveSchedule); }, [liveSchedule, schedule]);
    const run = async (fn, ok) => {
        setBusy(true);
        setMsg(null);
        setMissing([]);
        try {
            await fn();
            setMsg(t(ok));
        }
        catch (e) {
            const err = apiError(e);
            setMissing(err.fields);
            const label = (f) => (f.startsWith('contratista.') ? t('ctr.contractor') : f === 'signature' ? t('ctr.yourSignature')
                : f === 'signer.email' ? t('ctr.a.signerEmail') : f === 'schedule' ? t('ctr.schedule') : t(`ctr.t.${f}`));
            setMsg(err.fields.length ? t('ctr.a.missing', { fields: [...new Set(err.fields.map(label))].join(', ') }) : t('ob.a.error'));
        }
        finally {
            setBusy(false);
        }
    };
    const save = () => contractsApi.save(brand.id, draft.id, { terms: draft.terms, scope: draft.scope, schedule: draft.schedule, checklist: draft.checklist, signer: draft.signer });
    if (!contractId || (!contract && !live.loading))
        return null;
    if (!draft)
        return _jsx("div", { className: "card t-mute", children: t('common.loading') });
    const status = draft.status;
    const term = (k) => draft.terms[k] ?? '';
    const setTerm = (k, v) => setDraft({ ...draft, terms: { ...draft.terms, [k]: v } });
    const bad = (k) => (missing.includes(k) ? { borderColor: 'var(--danger)' } : undefined);
    const field = (k, label, input) => _jsxs("label", { className: "col g4 t-sm", children: [_jsx("span", { className: "w7", children: label }), input] }, k);
    return (_jsxs("section", { className: "col g16", children: [_jsxs("div", { className: "card col g16", style: { padding: 22 }, children: [_jsxs("div", { className: "row between g8 wrap", children: [_jsx("h2", { className: "h3", children: t('ctr.a.title') }), _jsx("span", { className: "chip", children: t(`ctr.status.${status}`) })] }), status === 'draft' && (_jsxs(_Fragment, { children: [_jsx("p", { className: "t-sm t-mute", children: t('ctr.a.createSub') }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [field('signer.name', t('ctr.a.signerName'), _jsx("input", { className: "input", value: draft.signer.name, onChange: (e) => setDraft({ ...draft, signer: { ...draft.signer, name: e.target.value } }) })), field('signer.email', t('ctr.a.signerEmail'), _jsx("input", { className: "input", type: "email", value: draft.signer.email, style: bad('signer.email'), onChange: (e) => setDraft({ ...draft, signer: { ...draft.signer, email: e.target.value } }) })), field('pago.cuota', t('ctr.t.pago.cuota'), _jsx("input", { className: "input", inputMode: "numeric", placeholder: "6.250.000", value: term('pago.cuota'), style: bad('pago.cuota'), onChange: (e) => setTerm('pago.cuota', e.target.value) })), field('plazo.meses', t('ctr.t.plazo.meses'), _jsx("input", { className: "input", type: "number", min: 1, max: 36, value: term('plazo.meses'), style: bad('plazo.meses'), onChange: (e) => setTerm('plazo.meses', e.target.value) })), field('plazo.inicio', t('ctr.t.plazo.inicio'), _jsx("input", { className: "input", type: "date", value: /^\d{4}-\d{2}-\d{2}$/.test(term('plazo.inicio')) ? term('plazo.inicio') : '', style: bad('plazo.inicio'), onChange: (e) => setTerm('plazo.inicio', e.target.value) })), field('objeto', t('ctr.t.objeto'), _jsx("input", { className: "input", value: term('objeto'), style: bad('objeto'), onChange: (e) => setTerm('objeto', e.target.value) }))] }), _jsx("p", { className: "t-xs t-mute", children: t('ctr.a.signerNote') }), _jsxs("details", { className: "col g12", children: [_jsx("summary", { className: "w7 t-sm", style: { cursor: 'pointer' }, children: t('ctr.a.more') }), _jsxs("div", { className: "col g16", style: { marginTop: 12 }, children: [_jsx(TermsForm, { terms: draft.terms, missing: missing, hide: [...MAIN], onChange: (terms) => setDraft({ ...draft, terms }) }), field('scope', t('ctr.annex1'), _jsx("textarea", { className: "input", rows: 5, value: draft.scope, placeholder: t('ctr.a.scopeHint'), onChange: (e) => setDraft({ ...draft, scope: e.target.value }) }))] })] }), _jsxs("details", { className: "col g12", children: [_jsx("summary", { className: "w7 t-sm", style: { cursor: 'pointer' }, children: t('ctr.a.annexes') }), _jsxs("div", { className: "col g16", style: { marginTop: 12 }, children: [_jsx(GanttEditor, { schedule: draft.schedule, onChange: (s) => setDraft({ ...draft, schedule: s }) }), _jsx(ChecklistEditor, { items: draft.checklist, weeks: draft.schedule.weeks, onChange: (checklist) => setDraft({ ...draft, checklist }) })] })] }), _jsx(SignaturePad, { label: t('ctr.yourSignature'), onChange: setSignature }), _jsxs("div", { className: "row g8 wrap", children: [_jsx("button", { className: "btn btn-primary", disabled: busy || !signature, onClick: () => run(async () => { await save(); await contractsApi.send(brand.id, draft.id, signature); }, 'ctr.a.sent'), children: t('ctr.a.send') }), _jsx("button", { className: "btn btn-ghost", disabled: busy, onClick: () => run(async () => { await save(); setPreview((await contractsApi.preview(brand.id, draft.id)).text); }, 'ob.a.saved'), children: t('ctr.a.preview') })] })] })), status === 'sent' && (_jsxs("div", { className: "row between g8 wrap", children: [_jsx("span", { className: "t-sm", children: t('ctr.a.sentTo', { email: draft.signer.email }) }), _jsx("button", { className: "btn btn-ghost btn-sm", disabled: busy, onClick: () => run(() => contractsApi.reopen(brand.id, draft.id), 'ctr.a.reopened'), children: t('ctr.a.reopen') })] })), status === 'signed' && _jsx(ContractDownload, { brandId: brand.id, contract: draft, compact: true }), msg && _jsx("p", { className: "t-sm", role: "status", children: msg })] }), status === 'draft' && preview && _jsx("div", { className: "card", style: { padding: 22, maxHeight: 520, overflowY: 'auto' }, children: _jsx(ContractText, { text: preview }) }), status === 'sent' && draft.sentText && (_jsxs("details", { className: "card", style: { padding: 22 }, children: [_jsx("summary", { className: "w7", style: { cursor: 'pointer' }, children: t('ctr.text') }), _jsx("div", { style: { marginTop: 12 }, children: _jsx(ContractText, { text: draft.sentText }) })] })), status === 'signed' && schedule && (_jsxs("details", { className: "card col g12", style: { padding: 22 }, children: [_jsx("summary", { className: "h3", style: { cursor: 'pointer' }, children: t('ctr.a.liveSchedule') }), _jsx("p", { className: "t-xs t-mute", children: t('ctr.a.liveScheduleSub') }), _jsx(GanttEditor, { schedule: schedule, onChange: setSchedule }), _jsx("button", { className: "btn btn-secondary btn-sm", style: { alignSelf: 'flex-start' }, disabled: busy, onClick: () => run(() => contractsApi.saveSchedule(brand.id, schedule), 'ob.a.saved'), children: t('ob.a.save') })] }))] }));
}
