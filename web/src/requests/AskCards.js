import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
/** One of the three brief cards from the design (Product, Application, Scene). */
export function AskCard({ k, value, onChange }) {
    const { t } = useI18n();
    const [link, setLink] = useState('');
    const done = (value.text ?? '').trim().length > 0;
    const addLink = () => {
        const v = link.trim();
        if (!/^https?:\/\//i.test(v))
            return;
        onChange({ ...value, links: [...(value.links ?? []), v].slice(0, 10) });
        setLink('');
    };
    return (_jsxs("div", { className: "card col g12", children: [_jsxs("div", { className: "row between", children: [_jsx("span", { className: `kind ${k === 'scene' ? '' : 'kind-logodeck'}`, children: t(`ask.card.${k}`) }), _jsx("span", { className: `chip ${done ? 'c-approved' : k === 'scene' ? 'c-draft' : 'c-prod'}`, children: done ? t('ask.done') : k === 'scene' ? t('ask.optional') : t('ask.needed') })] }), _jsx("label", { className: "h3", htmlFor: `card-${k}`, children: t(`ask.q.${k}`) }), _jsx("textarea", { id: `card-${k}`, className: "input", style: { height: 110, padding: '12px 16px', resize: 'vertical' }, placeholder: t(`ask.ph.${k}`), value: value.text ?? '', onChange: (e) => onChange({ ...value, text: e.target.value }) }), (value.links ?? []).map((l) => (_jsxs("div", { className: "row g8 t-sm", children: [_jsx("a", { href: l, target: "_blank", rel: "noreferrer", className: "grow truncate", children: l }), _jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => onChange({ ...value, links: (value.links ?? []).filter((x) => x !== l) }), "aria-label": t('ask.removeLink'), children: "\u2715" })] }, l))), _jsxs("div", { className: "row g8", children: [_jsx("input", { className: "input", style: { height: 40 }, type: "url", placeholder: t('ask.linkPh'), "aria-label": t('ask.addLink'), value: link, onChange: (e) => setLink(e.target.value), onKeyDown: (e) => e.key === 'Enter' && (e.preventDefault(), addLink()) }), _jsx("button", { className: "btn btn-secondary btn-sm", onClick: addLink, children: t('ask.addLink') })] })] }));
}
