import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { ImagesEdit, LogosEdit } from './VisualEdit';
import { ColorsEdit, FontsEdit } from './ListEdit';
import { PrimalEdit, StrategyEdit, VoiceEdit } from './WordsEdit';
const TABS = ['logos', 'colors', 'type', 'concept', 'mockups', 'primal', 'voice', 'strategy'];
/** Admin editor of Mi marca: one tab per section, each saved on its own (same logic as the Braindy connector). */
export function BrandEditor({ brandId, identity, voice, brain, primal, onClose }) {
    const { t } = useI18n();
    const [tab, setTab] = useState('logos');
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        addEventListener('keydown', onKey);
        return () => removeEventListener('keydown', onKey);
    }, [onClose]);
    return (_jsx("div", { className: "scrim fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4", onMouseDown: (e) => e.target === e.currentTarget && onClose(), children: _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": "h-be", className: "card col g16 my-6 w-full", style: { maxWidth: 880 }, children: [_jsxs("div", { className: "row between g12", children: [_jsxs("div", { className: "col g4", children: [_jsx("h2", { className: "h3", id: "h-be", children: t('be.title') }), _jsx("span", { className: "t-xs t-mute", children: t('be.hint') })] }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: onClose, children: t('be.close') })] }), _jsx("div", { className: "seg seg-scroll", role: "tablist", children: TABS.map((k) => _jsx("button", { role: "tab", "aria-selected": tab === k, className: tab === k ? 'is-on' : '', onClick: () => setTab(k), children: t(`be.tab.${k}`) }, k)) }), tab === 'logos' && _jsx(LogosEdit, { brandId: brandId, logos: identity.logos }), tab === 'colors' && _jsx(ColorsEdit, { brandId: brandId, colors: identity.colors ?? [] }), tab === 'type' && _jsx(FontsEdit, { brandId: brandId, fonts: identity.typography ?? [] }), tab === 'concept' && _jsx(ImagesEdit, { brandId: brandId, field: "concept", items: identity.concept ?? [] }), tab === 'mockups' && _jsx(ImagesEdit, { brandId: brandId, field: "mockups", items: identity.galleryAssets ?? [] }), tab === 'primal' && _jsx(PrimalEdit, { brandId: brandId, primal: primal }), tab === 'voice' && _jsx(VoiceEdit, { brandId: brandId, voice: voice }), tab === 'strategy' && _jsx(StrategyEdit, { brandId: brandId, brain: brain })] }) }));
}
