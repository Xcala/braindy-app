import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { fromUrl, PickImages, SaveBar, Thumb, toSrc, useSave } from './shared';
/** Logos: primary, secondary, icon and other versions. */
export function LogosEdit({ brandId, logos }) {
    const { t } = useI18n();
    const { state, error, save } = useSave(brandId);
    const [slots, setSlots] = useState({ primary: fromUrl(logos?.primary), secondary: fromUrl(logos?.secondary), icon: fromUrl(logos?.icon) });
    const [vars, setVars] = useState((logos?.variations ?? []).filter((v) => v.startsWith('http')).map((v) => fromUrl(v)));
    const [err, setErr] = useState('');
    return (_jsxs("div", { className: "col g16", children: [_jsx("p", { className: "t-xs t-mute", children: t('be.imgHint') }), _jsx("div", { className: "grid gap-3 sm:grid-cols-3", children: ['primary', 'secondary', 'icon'].map((k) => (_jsxs("div", { className: "col g8", children: [_jsx("span", { className: "label", children: t(k === 'primary' ? 'brand.logoPrimary' : k === 'secondary' ? 'brand.logoSecondary' : 'brand.logoIcon') }), slots[k] ? _jsx(Thumb, { img: slots[k], onRemove: () => setSlots((s) => ({ ...s, [k]: null })) }) : _jsx("div", { className: "card t-sm t-mute", children: t('be.empty') }), _jsx(PickImages, { onError: setErr, onPick: ([img]) => setSlots((s) => ({ ...s, [k]: img })), children: slots[k] ? t('be.replace') : t('be.upload') })] }, k))) }), _jsxs("div", { className: "row between g8", children: [_jsx("span", { className: "label", children: t('be.variations') }), _jsx(PickImages, { multiple: true, onError: setErr, onPick: (imgs) => setVars((v) => [...v, ...imgs]), children: t('be.addImages') })] }), _jsx("div", { className: "grid gap-3 grid-cols-2 sm:grid-cols-4", children: vars.map((v, i) => _jsx(Thumb, { img: v, onRemove: () => setVars((x) => x.filter((_, j) => j !== i)) }, v.preview)) }), err && _jsx("p", { className: "t-sm", style: { color: 'var(--danger)' }, children: err }), _jsx(SaveBar, { state: state, error: error, onSave: () => save({
                    logos: {
                        ...Object.fromEntries(['primary', 'secondary', 'icon'].map((k) => [k, slots[k] ? toSrc(slots[k]) : null])),
                        variations: vars.map(toSrc),
                    },
                }) })] }));
}
/** Concept images or mockups: a list of images with a caption each. */
export function ImagesEdit({ brandId, field, items }) {
    const { t } = useI18n();
    const { state, error, save } = useSave(brandId);
    const [list, setList] = useState(items.filter((i) => i.url?.startsWith('http')).map((i) => ({ img: fromUrl(i.url), text: i.caption ?? i.name ?? '' })));
    const [err, setErr] = useState('');
    return (_jsxs("div", { className: "col g16", children: [_jsx("div", { children: _jsx(PickImages, { multiple: true, onError: setErr, onPick: (imgs) => setList((l) => [...l, ...imgs.map((img) => ({ img, text: '' }))]), children: t('be.addImages') }) }), list.length === 0 && _jsx("p", { className: "t-sm t-mute", children: t('be.empty') }), _jsx("div", { className: "grid gap-3 grid-cols-2 sm:grid-cols-3", children: list.map((x, i) => (_jsx(Thumb, { img: x.img, onRemove: () => setList((l) => l.filter((_, j) => j !== i)), children: _jsx("input", { className: "input", style: { height: 36, fontSize: 13 }, placeholder: t(field === 'concept' ? 'be.caption' : 'be.mockupName'), value: x.text, onChange: (e) => setList((l) => l.map((y, j) => (j === i ? { ...y, text: e.target.value } : y))) }) }, x.img.preview))) }), err && _jsx("p", { className: "t-sm", style: { color: 'var(--danger)' }, children: err }), _jsx(SaveBar, { state: state, error: error, onSave: () => save(field === 'concept'
                    ? { concept: list.map((x) => ({ image: toSrc(x.img), caption: x.text })) }
                    : { mockups: list.map((x) => ({ image: toSrc(x.img), name: x.text })) }) })] }));
}
