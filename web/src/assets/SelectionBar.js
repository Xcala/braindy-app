import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
/**
 * What to do with the ticked files: download them as a .zip (everyone) and, for NickMark, move them to a folder or
 * send them to the trash. Without a selection it only offers "Select all".
 */
export function SelectionBar({ actions, pageIds, folders, admin }) {
    const { t } = useI18n();
    const [to, setTo] = useState('');
    const ids = [...actions.picked];
    if (!ids.length) {
        return pageIds.length > 0
            ? _jsx("p", { className: "t-xs t-mute row g8 wrap", style: { margin: 0 }, children: _jsx("button", { type: "button", className: "t-xs w7", style: { color: 'var(--azul)' }, title: t('files.rangeHint'), onClick: () => actions.setPicked(new Set(pageIds)), children: t('files.selectAll') }) })
            : null;
    }
    return (_jsxs("div", { className: "selbar", role: "toolbar", "aria-label": t('files.selected', { n: String(ids.length) }), children: [_jsx("span", { className: "fx-count", children: t('files.selected', { n: String(ids.length) }) }), _jsxs("button", { type: "button", className: "btn btn-secondary btn-sm", disabled: actions.busy, onClick: () => actions.zip(ids), children: [_jsx(Icon, { name: "download", size: 14 }), " ", t('files.zip')] }), admin && (_jsxs("span", { className: "fx-move", children: [_jsxs("label", { className: "fx-select is-sm", children: [_jsxs("select", { value: to, onChange: (e) => setTo(e.target.value), "aria-label": t('files.moveTo'), children: [_jsxs("option", { value: "", children: [t('files.moveTo'), "\u2026"] }), folders.map((p) => _jsx("option", { value: p || '/', children: p || t('files.rootFolder') }, p || '·'))] }), _jsx(Icon, { name: "chevronDown", size: 14 })] }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", disabled: !to || actions.busy, onClick: () => { actions.move(ids, to === '/' ? '' : to); setTo(''); }, children: t('files.moveBtn') })] })), admin && (_jsxs("button", { type: "button", className: "btn btn-danger btn-sm", disabled: actions.busy, onClick: () => actions.setAsk({ kind: 'trash', ids }), children: [_jsx(Icon, { name: "trash", size: 14 }), " ", t('files.toTrash')] })), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm fx-end", disabled: actions.busy, onClick: actions.clear, children: t('files.clearSel') })] }));
}
