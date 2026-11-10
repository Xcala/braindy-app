import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate } from 'react-router';
import { useBrands } from '../brands/BrandProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Steps } from '../onboarding/Steps';
import { ContractStep } from '../onboarding/ContractStep';
import { KickoffStep } from '../onboarding/KickoffStep';
import { StrategyStep } from '../onboarding/StrategyStep';
/** Onboarding in 3 steps (2026-10-30): rules of the game (contract), kickoff, strategy and training. */
export function Onboarding() {
    const { current } = useBrands();
    const { t } = useI18n();
    if (!current)
        return _jsx("p", { className: "t-mute", children: t('brand.none') });
    const ob = current.onboarding;
    if (!ob || ob.step === 'live')
        return _jsx(Navigate, { to: "/home", replace: true });
    return (_jsxs("div", { className: "grid grid-cols-1 items-start gap-7 lg:grid-cols-[320px_minmax(0,1fr)]", children: [_jsx(Steps, { step: ob.step }), ob.step === 'contract' ? _jsx(ContractStep, { brandId: current.id, contractId: ob.contractId })
                : ob.step === 'kickoff' ? _jsx(KickoffStep, { brand: current })
                    : _jsx(StrategyStep, { brand: current })] }));
}
