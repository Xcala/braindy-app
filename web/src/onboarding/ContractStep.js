import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useBrandDoc } from '../brands/useBrandDoc';
import { useI18n } from '../i18n/I18nProvider';
import { SignContract } from '../contracts/SignContract';
import { ContractDownload } from '../contracts/ContractDownload';
/** Step 1 · Rules of the game: the legal representative signs; everyone else sees where it stands. */
export function ContractStep({ brandId, contractId }) {
    const { t } = useI18n();
    const { data, loading } = useBrandDoc(brandId, `contracts/${contractId ?? '-'}`);
    if (loading && contractId)
        return _jsx("div", { className: "card t-mute", children: t('common.loading') });
    const contract = data ? { id: contractId, ...data } : null;
    if (!contract || contract.status === 'draft') {
        return (_jsxs("div", { className: "stage col g12 rounded-[20px] p-6 sm:p-9", children: [_jsx("p", { className: "label", children: t('ctr.step1') }), _jsxs("h1", { className: "d-lg", style: { color: '#fff', fontSize: 40, lineHeight: '44px' }, children: [_jsx("span", { className: "w9", children: t('ctr.rules1') }), " ", t('ctr.rules2')] }), _jsx("p", { className: "t-lg muted", children: t('ctr.repSigning') })] }));
    }
    if (contract.status === 'sent')
        return _jsx(SignContract, { brandId: brandId, contract: contract });
    return (_jsxs("section", { className: "col g20", children: [_jsxs("div", { className: "stage col g12 rounded-[20px] p-6 sm:p-9", children: [_jsx("p", { className: "label", children: t('ctr.step1') }), _jsxs("h1", { className: "d-lg", style: { color: '#fff', fontSize: 40, lineHeight: '44px' }, children: [_jsx("span", { className: "w9", children: t('ctr.youSigned1') }), " ", t('ctr.youSigned2')] }), _jsx("p", { className: "t-lg muted", children: t(contract.source === 'external' ? 'ctr.bothSignedOutside' : 'ctr.bothSigned') })] }), contract.status === 'signed' && _jsx(ContractDownload, { brandId: brandId, contract: contract })] }));
}
