import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../i18n/I18nProvider';
import { findCategory } from './taxonomy';
import { AskCard } from './AskCards';
/** Optional detail for "Ask for something": exact piece, where it lives, how it should feel, format and language. */
export function AskDetails({ cat, value, onChange }) {
    const { t, lang } = useI18n();
    const category = findCategory(cat);
    const subcat = category?.subs.find((s) => s.id === value.sub);
    const set = (p) => onChange({ ...value, ...p });
    return (_jsxs("div", { className: "col g16", children: [category && (_jsxs("div", { className: "card col g12", children: [_jsx("div", { className: "row g8 wrap", children: category.subs.map((s) => (_jsx("button", { "aria-pressed": s.id === value.sub, onClick: () => set({ sub: s.id, type: '' }), className: `btn btn-sm ${s.id === value.sub ? 'btn-primary' : 'btn-secondary'}`, children: s.label[lang] }, s.id))) }), subcat && (_jsx("div", { className: "row g8 wrap", children: subcat.types.map((ty) => (_jsx("button", { "aria-pressed": value.type === ty[lang], onClick: () => set({ type: ty[lang] }), className: `chip ${value.type === ty[lang] ? 'c-approved' : 'chip-plain'}`, style: { cursor: 'pointer', border: 0 }, children: ty[lang] }, ty.en))) }))] })), _jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [_jsx(AskCard, { k: "application", value: value.application, onChange: (c) => set({ application: c }) }), _jsx(AskCard, { k: "scene", value: value.scene, onChange: (c) => set({ scene: c }) })] }), _jsxs("div", { className: "card grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "d2", children: t('ask.format') }), _jsx("input", { className: "input", id: "d2", value: value.format, placeholder: t('ask.formatPh'), onChange: (e) => set({ format: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "d3", children: t('ask.language') }), _jsx("input", { className: "input", id: "d3", value: value.language, onChange: (e) => set({ language: e.target.value }) })] })] })] }));
}
