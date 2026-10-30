import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nProvider';
export const fromUrl = (url) => (url ? { url, preview: url } : null);
export const toSrc = (i) => (i.base64 ? { base64: i.base64, name: i.name } : { url: i.url });
const MAX = 15 * 1024 ** 2;
export function readImage(file) {
    return new Promise((res, rej) => {
        if (!file.type.startsWith('image/'))
            return rej(new Error(`${file.name}: no es una imagen`));
        if (file.size > MAX)
            return rej(new Error(`${file.name}: pasa de 15 MB`));
        const r = new FileReader();
        r.onload = () => res({ base64: String(r.result).split(',')[1], name: file.name, preview: URL.createObjectURL(file) });
        r.onerror = () => rej(r.error);
        r.readAsDataURL(file);
    });
}
/** Saves one section through the same backend logic the Braindy connector uses. */
export function useSave(brandId) {
    const [state, setState] = useState('idle');
    const [error, setError] = useState('');
    const save = async (body) => {
        setState('busy');
        setError('');
        try {
            await api(`/v1/admin/brands/${brandId}/identity`, { method: 'POST', body: JSON.stringify(body) });
            setState('done');
        }
        catch (e) {
            setError(e.message);
            setState('error');
        }
    };
    return { state, error, save };
}
export function SaveBar({ state, error, onSave }) {
    const { t } = useI18n();
    return (_jsxs("div", { className: "row between g12 wrap", style: { borderTop: '1px solid var(--line)', paddingTop: 14 }, children: [_jsx("span", { className: "t-sm", role: "status", style: { color: state === 'error' ? 'var(--danger)' : 'var(--success)' }, children: state === 'done' ? t('be.saved') : state === 'error' ? t('be.error', { e: error }) : '' }), _jsx("button", { type: "button", className: "btn btn-primary", disabled: state === 'busy', onClick: onSave, children: state === 'busy' ? t('be.saving') : t('be.save') })] }));
}
/** A file button that hands back images (one or several). */
export function PickImages({ multiple, onPick, children, onError }) {
    const ref = useRef(null);
    return (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => ref.current?.click(), children: children }), _jsx("input", { ref: ref, type: "file", accept: "image/*", multiple: multiple, className: "sr", tabIndex: -1, onChange: async (e) => {
                    try {
                        onPick(await Promise.all([...(e.target.files ?? [])].map(readImage)));
                    }
                    catch (err) {
                        onError(err.message);
                    }
                    e.target.value = '';
                } })] }));
}
export function Thumb({ img, onRemove, children }) {
    const { t } = useI18n();
    return (_jsxs("div", { className: "col g8", style: { border: '1px solid var(--line)', borderRadius: 14, padding: 10, background: '#fff' }, children: [_jsx("div", { style: { height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'repeating-conic-gradient(#EEF0F4 0% 25%, #fff 0% 50%) 50% / 16px 16px', borderRadius: 10 }, children: _jsx("img", { src: img.preview, alt: "", style: { maxWidth: '90%', maxHeight: 96, objectFit: 'contain' } }) }), children, _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: onRemove, children: t('be.remove') })] }));
}
export const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
export const commas = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
