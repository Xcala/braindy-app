import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from '../components/Icon';
import { bulkUpdate } from './bulkActions';
const STATUSES = ['in_production', 'to_approve', 'approved', 'published'];
/** NickMark only: the same bar as Files when requests are ticked. Move, set a due date, tag a campaign, archive. */
export function BulkBar({ brandId, ids, archived, tags, clear }) {
    const { t } = useI18n();
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    const [due, setDue] = useState('');
    const [tag, setTag] = useState('');
    const run = async (c, done) => {
        setBusy(true);
        setMsg(null);
        try {
            await bulkUpdate(brandId, ids, c);
            setMsg({ ok: true, text: done });
            if (c.kind === 'archive' || c.kind === 'status')
                clear();
        }
        catch {
            setMsg({ ok: false, text: t('files.actionError') });
        }
        finally {
            setBusy(false);
        }
    };
    const n = ids.length;
    const cleanTag = tag.trim().replace(/^#/, '').slice(0, 40);
    return (_jsxs("div", { className: "col g8", children: [_jsxs("div", { className: "selbar", role: "region", "aria-label": t('files.selected', { n }), children: [_jsx("span", { className: "fx-count", children: t('files.selected', { n }) }), _jsxs("label", { className: "fx-select is-sm", children: [_jsx("span", { className: "sr", children: t('rb.move') }), _jsxs("select", { value: "", disabled: busy, "aria-label": t('rb.move'), onChange: (e) => e.target.value && run({ kind: 'status', status: e.target.value }, t('rb.moved', { n })), children: [_jsx("option", { value: "", children: t('rb.move') }), STATUSES.map((s) => _jsx("option", { value: s, children: t(`req.status.${s}`) }, s))] }), _jsx(Icon, { name: "chevronDown", size: 14 })] }), _jsxs("span", { className: "row g4", children: [_jsx("input", { type: "date", className: "input", style: { height: 36, width: 150 }, value: due, onChange: (e) => setDue(e.target.value), "aria-label": t('rb.due') }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", disabled: busy || !due, onClick: () => run({ kind: 'due', dueDate: due }, t('rb.dueSet', { n })), children: t('rb.due') })] }), _jsxs("span", { className: "row g4", children: [_jsx("input", { className: "input", list: "rb-tags", style: { height: 36, width: 160 }, placeholder: t('rb.tagPh'), value: tag, onChange: (e) => setTag(e.target.value), "aria-label": t('rb.tagPh') }), _jsx("datalist", { id: "rb-tags", children: tags.map((g) => _jsx("option", { value: g }, g)) }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", disabled: busy || !cleanTag, onClick: () => run({ kind: 'tag', tag: cleanTag, add: true }, t('rb.tagged', { n, tag: cleanTag })), children: t('rb.tagAdd') }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", disabled: busy || !cleanTag, onClick: () => run({ kind: 'tag', tag: cleanTag, add: false }, t('rb.untagged', { n, tag: cleanTag })), children: t('rb.tagRemove') })] }), _jsxs("button", { type: "button", className: "btn btn-secondary btn-sm", disabled: busy, onClick: () => run({ kind: 'archive', archived: !archived }, t(archived ? 'rb.unarchived' : 'rb.archived', { n })), children: [_jsx(Icon, { name: archived ? 'restore' : 'archive', size: 16 }), t(archived ? 'rb.unarchive' : 'rb.archive')] }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm fx-end", onClick: clear, children: t('files.clearSel') })] }), msg && _jsx("p", { className: "t-sm", role: "status", style: { margin: 0, color: msg.ok ? 'var(--success)' : 'var(--danger)' }, children: msg.text })] }));
}
