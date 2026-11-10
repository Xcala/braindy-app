import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { SignContract } from '../contracts/SignContract';
import { ContractDownload } from '../contracts/ContractDownload';
const TONE = {
    wait: { background: '#FFFBF0', borderColor: '#F5D98A' },
    ok: { background: '#E6F7F0', borderColor: '#A7E3C8' },
};
/** The contract that makes the plan binding, where it stands: in preparation, to sign (the signer signs right here),
 *  or signed with the sealed PDF (NickMark signs when sending, so the client's signature closes it). Admin gets a shortcut to the contract panel. */
export function ContractCard({ brandId, contract }) {
    const { t } = useI18n();
    const { user, profile } = useAuth();
    const admin = profile?.role === 'admin';
    const isSigner = !!contract && (user?.email ?? '').toLowerCase() === contract.signer.email.toLowerCase();
    const panel = admin && _jsx(Link, { to: "/admin/onboarding", className: "btn btn-secondary btn-sm", children: t('plan.c.panel') });
    const head = (title, body, style) => (_jsxs("div", { className: "card card-tight row g16", style: { justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', ...style }, children: [_jsxs("div", { className: "col g4", style: { minWidth: 0, flex: '1 1 320px' }, children: [_jsx("span", { className: "label", children: t('plan.c.label') }), _jsx("span", { className: "w9", style: { fontSize: 20, lineHeight: '26px' }, children: title }), _jsx("span", { className: "t-sm t-mute", children: body })] }), panel] }));
    let body;
    if (!contract || contract.status === 'draft')
        body = head(t('plan.c.prep'), admin ? t('plan.c.prepAdmin') : t('plan.c.prepBody'));
    else if (contract.status === 'sent') {
        body = isSigner && !admin
            ? _jsxs("div", { className: "col g12", children: [head(t('plan.c.toSign'), t('plan.c.toSignBody'), TONE.wait), _jsx(SignContract, { brandId: brandId, contract: contract })] })
            : head(t('plan.c.toSign'), t('plan.c.waitingSigner', { name: contract.signer.name || contract.signer.email }), TONE.wait);
    }
    else
        body = _jsxs("div", { className: "col g12", children: [head(t('plan.c.signed'), t(contract.source === 'external' ? 'ctr.bothSignedOutside' : 'ctr.bothSigned'), TONE.ok), _jsx(ContractDownload, { brandId: brandId, contract: contract, compact: true })] });
    return _jsx("section", { className: "col g12", "aria-label": t('plan.c.label'), children: body });
}
