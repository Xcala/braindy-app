import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { Popover } from '../requests/Popover';
import { useToast } from '../components/Toaster';
import { shareApi, shareUrl } from './api';
/**
 * On My files, for NickMark and the brand's owners: a link to receive files without an account, and the showcase of
 * approved work. Nothing shows for anyone else (the API answers 403).
 */
export function ShareLinks({ brandId }) {
    const { t } = useI18n();
    const toast = useToast();
    const [links, setLinks] = useState(null);
    const [label, setLabel] = useState('');
    const [busy, setBusy] = useState(false);
    const load = useCallback(() => shareApi.list(brandId).then(setLinks, () => setLinks(null)), [brandId]);
    useEffect(() => { void load(); }, [load]);
    if (!links)
        return null;
    const copy = async (kind, token) => {
        await navigator.clipboard.writeText(shareUrl(kind, token)).catch(() => undefined);
        toast({ text: t('ul.copied') });
    };
    const create = async (kind) => {
        setBusy(true);
        try {
            const { token } = await shareApi.create(brandId, kind, kind === 'upload' ? label.trim() : '');
            setLabel('');
            await load();
            await copy(kind, token);
        }
        finally {
            setBusy(false);
        }
    };
    const off = async (kind, token) => { await shareApi.off(brandId, kind, token); await load(); toast({ text: t('ul.offDone') }); };
    const show = links.showcase[0];
    return (_jsxs("div", { className: "row g8 wrap", children: [_jsx(Popover, { align: "right", className: "btn btn-secondary", label: _jsxs(_Fragment, { children: [_jsx(Icon, { name: "upload" }), t('ul.btn')] }), children: () => (_jsxs("div", { className: "col g12", children: [_jsx("p", { className: "w7", children: t('ul.title') }), _jsx("p", { className: "t-sm t-mute", children: t('ul.lead') }), links.upload.length === 0 && _jsx("p", { className: "t-xs t-mute", children: t('ul.none') }), links.upload.map((l) => (_jsxs("div", { className: "col g4 share-row", children: [_jsx("span", { className: "t-sm w7 truncate", children: l.label || t('ul.title') }), _jsx("span", { className: "t-xs t-mute", children: t('ul.count', { n: l.count }) }), _jsxs("div", { className: "row g8", children: [_jsx("button", { className: "btn btn-primary btn-sm", onClick: () => copy('upload', l.token), children: t('ul.copy') }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => off('upload', l.token), children: t('ul.off') })] })] }, l.token))), _jsxs("label", { className: "col g4", children: [_jsx("span", { className: "t-xs w7", children: t('ul.label') }), _jsx("input", { className: "input", value: label, maxLength: 60, placeholder: t('ul.labelPh'), onChange: (e) => setLabel(e.target.value), style: { height: 40 } })] }), _jsxs("button", { className: "btn btn-secondary btn-sm self-start", disabled: busy, onClick: () => create('upload'), children: [_jsx(Icon, { name: "plus", size: 16 }), t('ul.create')] })] })) }), _jsx(Popover, { align: "right", className: "btn btn-secondary", label: _jsxs(_Fragment, { children: [_jsx(Icon, { name: "grid" }), t('sh.btn')] }), children: () => (_jsxs("div", { className: "col g12", children: [_jsx("p", { className: "w7", children: t('sh.title') }), _jsx("p", { className: "t-sm t-mute", children: t('sh.lead') }), show ? (_jsxs("div", { className: "row g8 wrap", children: [_jsxs("a", { className: "btn btn-primary btn-sm", href: shareUrl('showcase', show.token), target: "_blank", rel: "noreferrer", children: [t('sh.open'), " \u2197"] }), _jsx("button", { className: "btn btn-secondary btn-sm", onClick: () => copy('showcase', show.token), children: t('sh.copy') }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => off('showcase', show.token), children: t('sh.off') })] })) : _jsx("button", { className: "btn btn-primary btn-sm self-start", disabled: busy, onClick: () => create('showcase'), children: t('sh.create') })] })) })] }));
}
