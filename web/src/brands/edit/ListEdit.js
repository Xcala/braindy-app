import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { SaveBar, useSave } from './shared';
const HEX = /^#[0-9a-f]{6}$/i;
/** Brand palette: hex, name and Pantone per color, main color first. */
export function ColorsEdit({ brandId, colors }) {
    const { t } = useI18n();
    const { state, error, save } = useSave(brandId);
    const [list, setList] = useState(colors.filter((c) => HEX.test(c.hex ?? '')));
    const set = (i, patch) => setList((l) => l.map((c, j) => (j === i ? { ...c, ...patch } : c)));
    return (_jsxs("div", { className: "col g12", children: [list.map((c, i) => (_jsxs("div", { className: "row g8 wrap", children: [_jsx("input", { type: "color", "aria-label": "Color", value: HEX.test(c.hex ?? '') ? c.hex : '#000000', onChange: (e) => set(i, { hex: e.target.value.toUpperCase() }), style: { width: 44, height: 40, border: 0, background: 'none' } }), _jsx("input", { className: "input", style: { height: 40, width: 110 }, value: c.hex ?? '', onChange: (e) => set(i, { hex: e.target.value }), "aria-label": "Hex" }), _jsx("input", { className: "input grow", style: { height: 40, minWidth: 140 }, placeholder: t('be.colorName'), value: c.name ?? '', onChange: (e) => set(i, { name: e.target.value }) }), _jsx("input", { className: "input", style: { height: 40, width: 120 }, placeholder: "Pantone", value: c.pantone ?? '', onChange: (e) => set(i, { pantone: e.target.value }) }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => setList((l) => l.filter((_, j) => j !== i)), children: t('be.remove') })] }, i))), _jsx("div", { children: _jsxs("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => setList((l) => [...l, { hex: '#000000', name: '' }]), children: ["+ ", t('be.add')] }) }), _jsx(SaveBar, { state: state, error: error, onSave: () => save({ colors: list.map((c) => ({ hex: (c.hex ?? '').trim(), name: c.name, pantone: c.pantone || undefined })) }) })] }));
}
/** Brand fonts: family, use, Google Fonts or custom, optional link. */
export function FontsEdit({ brandId, fonts }) {
    const { t } = useI18n();
    const { state, error, save } = useSave(brandId);
    const [list, setList] = useState(fonts.map((f) => ({ ...f, fontFamily: f.fontFamily ?? f.name ?? '' })));
    const set = (i, patch) => setList((l) => l.map((f, j) => (j === i ? { ...f, ...patch } : f)));
    return (_jsxs("div", { className: "col g12", children: [list.map((f, i) => (_jsxs("div", { className: "row g8 wrap", children: [_jsx("input", { className: "input grow", style: { height: 40, minWidth: 160 }, placeholder: t('be.font'), value: f.fontFamily ?? '', onChange: (e) => set(i, { fontFamily: e.target.value }) }), _jsx("input", { className: "input", style: { height: 40, width: 160 }, placeholder: t('be.fontRole'), value: f.role ?? '', onChange: (e) => set(i, { role: e.target.value }) }), _jsxs("label", { className: "row g4 t-sm", children: [_jsx("input", { type: "checkbox", checked: f.type === 'google', onChange: (e) => set(i, { type: e.target.checked ? 'google' : 'custom' }) }), t('be.fontGoogle')] }), _jsx("input", { className: "input", style: { height: 40, minWidth: 180 }, placeholder: t('be.fontUrl'), value: f.url ?? f.downloadUrl ?? '', onChange: (e) => set(i, { url: e.target.value }) }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => setList((l) => l.filter((_, j) => j !== i)), children: t('be.remove') })] }, i))), _jsx("div", { children: _jsxs("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => setList((l) => [...l, { fontFamily: '', role: '', type: 'google' }]), children: ["+ ", t('be.add')] }) }), _jsx(SaveBar, { state: state, error: error, onSave: () => save({
                    typography: list.filter((f) => f.fontFamily?.trim()).map((f) => ({ fontFamily: f.fontFamily.trim(), role: f.role, type: f.type === 'google' ? 'google' : 'custom', url: f.url || f.downloadUrl || undefined, description: f.description })),
                }) })] }));
}
