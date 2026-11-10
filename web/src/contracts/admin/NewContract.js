import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useBrands } from '../../brands/BrandProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { contractsApi } from '../api';
import { SignedUpload } from './SignedUpload';
const PRESETS = ['brand3m', 'marketing6m', 'empty'];
/** Admin · start a contract for a brand: prepare it here (from a plan), or upload one already signed outside. */
export function NewContract({ onCreated }) {
    const { t } = useI18n();
    const { brands } = useBrands();
    const [brandId, setBrandId] = useState('');
    const [preset, setPreset] = useState('brand3m');
    const [upload, setUpload] = useState(false);
    const [busy, setBusy] = useState(false);
    const fresh = !brands.find((b) => b.id === brandId)?.onboarding;
    const done = () => { onCreated(brandId); setBrandId(''); setUpload(false); };
    return (_jsxs("div", { className: "card col g8", children: [_jsx("h2", { className: "h3", children: t('ctr.a.new') }), _jsxs("select", { className: "input", value: brandId, onChange: (e) => setBrandId(e.target.value), "aria-label": t('ob.a.pickBrand'), children: [_jsx("option", { value: "", children: t('ob.a.pickBrand') }), brands.filter((b) => b.status === 'active').map((b) => _jsx("option", { value: b.id, children: b.name }, b.id))] }), !upload && (_jsxs(_Fragment, { children: [_jsx("select", { className: "input", value: preset, onChange: (e) => setPreset(e.target.value), "aria-label": t('ctr.a.title'), children: PRESETS.map((p) => _jsx("option", { value: p, children: t(`ctr.p.${p}`) }, p)) }), _jsx("button", { className: "btn btn-primary btn-sm", disabled: !brandId || !fresh || busy, onClick: () => { setBusy(true); contractsApi.create(brandId, preset).then(done).finally(() => setBusy(false)); }, children: t('ctr.a.newCreate') })] })), _jsx("button", { className: "btn btn-ghost btn-sm", style: { alignSelf: 'flex-start' }, onClick: () => setUpload(!upload), children: upload ? t('ctr.a.newCreate') : t('ctr.a.newUpload') }), upload && brandId && _jsx(SignedUpload, { brandId: brandId, onDone: done })] }));
}
