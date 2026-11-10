import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { ContractText } from './ContractText';
import { Gantt } from './Gantt';
import { SignaturePad } from './SignaturePad';
import { Checklist } from './Checklist';
import { apiError, contractsApi } from './api';
import { sha256, withClient } from './text';
import { CLIENT_FIELDS } from './types';
/** One step for the legal representative: read, fill in the company, draw and sign. NickMark signed when
 *  sending, so this signature closes the contract. */
export function SignContract({ brandId, contract }) {
    const { t } = useI18n();
    const { brands } = useBrands();
    const { user } = useAuth();
    const email = (user?.email ?? '').toLowerCase();
    const isSigner = email === contract.signer.email;
    const [data, setData] = useState(() => ({ ...Object.fromEntries(CLIENT_FIELDS.map((k) => [k, ''])), razonSocial: brands.find((b) => b.id === brandId)?.name ?? '', representante: contract.signer.name, cargo: t('ctr.f.cargoDefault'), tipoDoc: 'C.C.' }));
    const [signature, setSignature] = useState(null);
    const [consent, setConsent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const text = useMemo(() => withClient(contract.sentText ?? '', { ...data, correo: email }), [contract.sentText, data, email]);
    const missing = CLIENT_FIELDS.filter((k) => !data[k].trim());
    const ready = isSigner && !missing.length && signature && consent;
    async function sign() {
        if (!ready || !signature)
            return;
        setBusy(true);
        setError(null);
        try {
            await contractsApi.sign(brandId, contract.id, { client: data, signature, consent, textHash: await sha256(text) });
        }
        catch (e) {
            const { code } = apiError(e);
            setError(t((`ctr.err.${code}` in ERR ? `ctr.err.${code}` : 'ctr.err.error')));
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("section", { className: "col g20 min-w-0", children: [_jsxs("div", { className: "stage col g12 rounded-[20px] p-6 sm:p-9", children: [_jsx("p", { className: "label", children: t('ctr.step1') }), _jsxs("h1", { className: "d-lg", style: { color: '#fff', fontSize: 40, lineHeight: '44px' }, children: [_jsx("span", { className: "w9", children: t('ctr.rules1') }), " ", t('ctr.rules2')] }), _jsx("p", { className: "t-lg muted", children: t('ctr.rulesSub') })] }), _jsxs("div", { className: "card col g12", style: { padding: 22, maxHeight: 640, overflowY: 'auto' }, tabIndex: 0, "aria-label": t('ctr.text'), children: [_jsx(ContractText, { text: text }), contract.scope && _jsxs(_Fragment, { children: [_jsx("h3", { className: "w9", style: { fontSize: 15 }, children: t('ctr.annex1') }), _jsx(ContractText, { text: contract.scope })] })] }), contract.schedule && (_jsxs("details", { className: "card col g12", style: { padding: 22 }, children: [_jsx("summary", { className: "w7", style: { cursor: 'pointer' }, children: t('ctr.annexes') }), _jsxs("div", { className: "col g16", style: { marginTop: 12 }, children: [_jsx(Gantt, { schedule: contract.schedule }), _jsx(Checklist, { items: contract.checklist, start: contract.schedule.start })] })] })), !isSigner ? (_jsx("div", { className: "card t-sm", role: "status", style: { background: '#EAF0FF', border: 0 }, children: t('ctr.notSigner', { email: contract.signer.email }) })) : (_jsxs("div", { className: "card col g16", style: { padding: 22 }, children: [_jsx("h2", { className: "h3", children: t('ctr.signTitle') }), _jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: CLIENT_FIELDS.map((k) => (_jsxs("label", { className: "col g4 t-sm", children: [_jsx("span", { className: "w7", children: t(`ctr.f.${k}`) }), _jsx("input", { className: "input", value: data[k], onChange: (e) => setData({ ...data, [k]: e.target.value }), autoComplete: "off", required: true })] }, k))) }), _jsx(SignaturePad, { label: t('ctr.yourSignature'), onChange: setSignature }), _jsxs("label", { className: "row g8 t-sm", style: { alignItems: 'flex-start' }, children: [_jsx("input", { type: "checkbox", checked: consent, onChange: (e) => setConsent(e.target.checked), style: { marginTop: 3 } }), _jsx("span", { children: t('ctr.consent') })] }), error && _jsx("p", { className: "t-sm", role: "alert", style: { color: 'var(--danger)' }, children: error }), _jsxs("div", { className: "row between g12 wrap", children: [_jsx("span", { className: "t-xs t-mute", children: missing.length ? t('ctr.missing', { n: missing.length }) : t('ctr.legal') }), _jsx("button", { className: "btn btn-primary", disabled: !ready || busy, onClick: sign, children: busy ? t('common.loading') : t('ctr.signBtn') })] })] }))] }));
}
const ERR = { 'ctr.err.not_signer': 1, 'ctr.err.text_changed': 1, 'ctr.err.not_signable': 1, 'ctr.err.missing': 1, 'ctr.err.signature': 1 };
